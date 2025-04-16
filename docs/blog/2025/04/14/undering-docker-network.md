---
date: 2025-04-14
---

# 如何彻底搞清楚 Docker 网络和 iptables 的关联

Docker 是现代开发和运维的标配工具，它的网络功能让容器可以像虚拟机一样通信。但你有没有遇到过容器网络不通、端口映射失效的问题？这些问题往往和 Docker 背后的 iptables 规则脱不开关系。这篇文章将带你深入理解 Docker 网络和 iptables 的关联，分析实际应用场景，并提供排查网络问题的实用方法。

## 一、Docker 网络的基础

Docker 的网络模型建立在 Linux 内核的网络命名空间（Network Namespace）之上。每个容器都有独立的网络命名空间，包含自己的网卡、路由表和 iptables 规则。Docker 提供了几种常见的网络模式：
- bridge（默认模式）：容器通过虚拟网桥（docker0）连接到宿主机网络，适合单机运行。
- host：容器直接使用宿主机的网络栈，没有隔离，性能最高。
- overlay：用于跨主机容器通信，常见于 Swarm 或 Kubernetes。
- none：容器没有网络接口，完全隔离。
这些网络模式的核心是通过 Linux 的网络工具（如 veth pair、bridge）和 iptables 实现的。iptables 是 Docker 网络的“幕后操盘手”，它控制着数据包的转发、NAT（网络地址转换）和过滤。

## 二、iptables 在 Docker 中的角色

iptables 是 Linux 内核的防火墙工具，用于管理数据包的流向。Docker 启动时，会自动在 iptables 中添加规则，主要涉及以下链：
- DOCKER：处理容器对外通信的 NAT 规则，比如端口映射（-p 8080:80）。
- DOCKER-USER：用户自定义规则，优先级高于 Docker 自动生成的规则。
- FORWARD：控制容器与外部网络或容器之间的数据转发。
- INPUT/OUTPUT：管理宿主机与容器的通信。

以默认的 bridge 模式为例，假设你运行一个容器并映射端口：
```bash
docker run -d -p 8080:80 nginx
```
Docker 会在 iptables 的 nat 表中添加类似以下规则：
```bash
-A DOCKER -p tcp -m tcp --dport 8080 -j DNAT --to-destination 172.17.0.2:80
```
这条规则的意思是：宿主机接收到的 8080 端口的 TCP 流量，会被 DNAT（目标地址转换）到容器 IP（比如 172.17.0.2）的 80 端口。
同时，filter 表的 FORWARD 链会允许容器与外部的通信：
```bash
-A FORWARD -o docker0 -j ACCEPT
-A FORWARD -i docker0 -j ACCEPT
```
这些规则确保容器能正常对外提供服务。但如果 iptables 配置被意外修改，或者防火墙策略冲突，网络问题就会接踵而至。

## 三、实际应用场景

假设你是一个后端开发者，部署了一个基于 Docker 的 Web 服务，架构如下：

- Nginx 容器：监听 80 端口，通过 -p 8080:80 映射到宿主机的 8080 端口。
- 后端 API 容器：运行在同一台宿主机，监听 3000 端口。
- 外部客户端：通过公网访问宿主机的 8080 端口，期望看到 Nginx 的页面。

这个场景中，iptables 确保了以下几点：
- 外部请求到达宿主机的 8080 端口后，通过 NAT 转发到 Nginx 容器的 80 端口。
- Nginx 容器可能需要访问后端 API 容器（比如通过 http://172.17.0.3:3000），这依赖于 docker0 网桥的转发规则。
- 宿主机的防火墙（iptables 或 firewalld）不能阻止 FORWARD 链的流量。

如果你的服务部署在云服务器上，情况会更复杂。你可能还需要配置云厂商的安全组规则，确保 8080 端口对公网开放。

## 四、容器网络不通的排查方法

首先，确保自己熟悉一条web请求到达容器后返回给请求方，都会经历哪些 iptables 的检查，可以阅读[请求去哪儿了？——iptables 的奇幻旅程](./what-is-the-iptables-do-when-request-is-done.md)。

然后，发现容器网络访问不通时（比如无法访问映射端口，或者容器间通信失败），可以按照以下步骤排查：

1. 检查 Docker 网络模式
运行以下命令，确认容器的网络模式：
```bash
docker inspect <container_id> | grep NetworkMode
```
如果是 bridge 模式，检查 docker0 网桥是否存在：
```bash
ip link show docker0
```

2. 检查 iptables 规则
查看 NAT 表和 filter 表的相关规则：
```bash
sudo iptables -t nat -L -n -v
sudo iptables -t filter -L -n -v
sudo iptables -L INPUT -n -v
```
重点关注 DOCKER 和 FORWARD 链，确保端口映射规则存在，且没有被其他规则阻止。比如，确认是否有类似 --dport 8080 -j DNAT 的规则。

如果规则缺失，可能需要重启 Docker 服务（注意：这会清空现有容器网络配置）：
```bash
sudo systemctl restart docker
```

3. 检查宿主机防火墙

某些发行版（如 CentOS）默认启用了 firewalld，它可能覆盖 iptables 规则。检查 firewalld 状态：
```bash
sudo systemctl status firewalld
```
临时禁用 firewalld 测试网络是否恢复：
```bash
sudo systemctl stop firewalld
```
如果问题解决，建议在 firewalld 中添加允许规则，而不是长期禁用。
4. 检查容器内部网络
进入容器，确认服务是否正常监听端口：
```bash
docker exec -it <container_id> bash
netstat -tuln
```
比如，Nginx 容器应该监听 80 端口。如果没有，检查容器内的服务配置。

5. 检查外部网络

如果是云服务器，登录云厂商控制台，确认安全组是否允许 8080 端口的入站流量。

6. 启用 Docker 日志

如果问题仍未解决，查看 Docker 日志：
```bash
sudo journalctl -u docker
```
日志可能提示 iptables 初始化失败或网桥配置错误。

## 五、注意事项

避免手动修改 iptables：Docker 管理的规则是动态生成的，手动修改可能被覆盖。建议使用 DOCKER-USER 链添加自定义规则。
备份 iptables 配置：在调试前，备份现有规则：
```bash
sudo iptables-save > iptables-backup.txt
```
考虑使用更高层的工具：如果 iptables 管理过于复杂，可以尝试 Docker Compose 或 Kubernetes，它们在网络配置上提供了更简单的抽象。

## 六、一次真实排障经历

某日突然发现 docker 容器内部无法访问宿主机上的服务假如宿主机的 ip 是 192.168.3.112，而服务本身是正常在线的。于是使用 tcpdump 抓包，怀疑哪条 iptables 规则就加入日志分析：

比如怀疑 INPUT 第 18 条的 REJECT 导致的，那就让其打印日志


```bash
[aaron@admin]$ sudo iptables -L INPUT -n -v --line-numbers
[sec@sec-admin auto_andu_account]$ sudo iptables -L INPUT -n -v --line-numbers
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
......
......
......
18     651  190K REJECT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            reject-with icmp-host-prohibited
```

加入日志打印：
```bash
sudo iptables -I INPUT 18 -j LOG --log-prefix "IPT REJECTED: " --log-level 4
```
然后监控日志

```bash
sudo tail -f /var/log/messages
```
最后定位到了是 iptables 的 INPUT 链的兜底规则导致的，于是放行 docker 容器访问宿主机的规则：

```bash
sudo iptables -I INPUT 1 -i br+ -d 192.168.3.112 -j ACCEPT
sudo iptables -I INPUT 2 -i docker0 -d 192.168.3.112 -j ACCEPT
sudo iptables -I INPUT 3 -i veth+ -d 192.168.3.112 -j ACCEPT
```

于是问题解决。

## 最后的话
Docker 网络和 iptables 的关系是容器通信的基石。理解它们的工作原理，不仅能帮你快速部署服务，还能让你在网络问题面前游刃有余。通过检查网络模式、iptables 规则、宿主机防火墙和容器内部状态，大多数网络问题都能迎刃而解。希望这篇文章能让你对 Docker 网络有更清晰的认识。如果你在实际操作中遇到问题，欢迎留言讨论！