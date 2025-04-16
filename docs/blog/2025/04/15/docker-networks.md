---
date: 2025-04-15
---


# Docker 网络配置

>请作为专业的docker工程师，一步一步教会我精通 docker 网络配置。

太好了，精通 Docker 网络配置是成为高级容器工程师的重要一步。我会从基础到进阶，系统地带你逐步掌握 Docker 的网络体系。我们会一边讲理论，一边动手操作。以下是学习路线图，我们会按阶段来进行：

---

## 🧭 学习路线图（Docker 网络配置）

### 📌 第一阶段：Docker 网络基础
1. Docker 网络模型简介
2. 四种常见网络驱动（bridge、host、none、overlay）
3. `docker network` 命令详解

### 📌 第二阶段：Bridge 网络深入
1. Bridge 网络原理（Linux bridge + iptables NAT）
2. 容器之间的通信与隔离
3. 创建自定义 bridge 网络
4. 使用 `--link` 和 `--network` 的区别

### 📌 第三阶段：高级网络配置
1. Docker DNS 与容器名解析
2. 多网络连接和网络别名
3. 与宿主机通信：端口映射与 host 网络
4. MACVLAN 网络实现与应用场景
5. IP 地址与子网控制

### 📌 第四阶段：Docker Compose 与网络
1. Compose 中定义网络
2. 多服务的网络依赖关系管理
3. Compose 多项目网络互联

### 📌 第五阶段：Overlay 网络与 Swarm 模式
1. Overlay 网络原理与配置
2. 多主机容器通信实践
3. Swarm 模式下的服务发现与负载均衡

### 📌 第六阶段：实战与调试技巧
1. 网络排障（ping、nslookup、tcpdump）
2. 与主机网络联调、抓包
3. 配合 iptables / firewalld / nftables 调试网络

---

我们可以每个阶段一小节一小节来过，你可以先告诉我：

> 你现在对 Docker 网络的了解有多少？是否已经用过 bridge 或 host 模式？我可以根据你的基础来安排第一课 😄



太棒了，70 分的基础已经不错了，我们就从**第一阶段的网络模型与驱动概览**开始，然后快速进入 Bridge 网络的底层原理和实践。每一步我会提供：

- 🌱 理论简要解释  
- 🛠️ 命令操作示例  
- 🔍 背后原理图解（可选）  
- ✅ 小练习巩固理解  

---

# 🧑‍🏫 第一课：Docker 网络模型与常见驱动概览

---

## 🌱 1. Docker 的网络模型简述

Docker 默认以 **容器网络隔离** + **软件定义网络（SDN）** 的方式设计网络。每个容器运行在自己的网络命名空间，和宿主机、其他容器隔离。

Docker 提供了多种 **网络驱动（network drivers）**，用来连接容器：

| 网络模式 | 用途 | 是否跨主机 |
|----------|------|------------|
| `bridge` | 默认模式，创建 NAT 网络 | 否 |
| `host`   | 使用宿主机网络堆栈 | 否 |
| `none`   | 容器无网络 | 否 |
| `overlay`| 用于多主机通信，需要 Swarm | 是 |
| `macvlan`| 容器像物理机一样有独立 IP | 否（需配置） |

---

## 🛠️ 2. 查看网络

```bash
docker network ls
```

你会看到系统默认的三个网络：

```bash
NETWORK ID     NAME      DRIVER    SCOPE
xxxxxxx        bridge    bridge    local
yyyyyyy        host      host      local
zzzzzzz        none      null      local
```

---

## 🌱 3. 网络驱动简要说明

### 🟦 bridge（默认）

- 容器间通信通过 Linux 的 **bridge + iptables NAT**
- 可以访问外网，但与宿主机 IP 不同
- 可以通过 `--network` 指定加入自定义网络
- 最适合：**单机部署、多个容器隔离互通**

### 🟥 host

- 容器使用宿主机的网络栈
- 没有 NAT，没有隔离，效率最高
- 缺点：多个容器可能端口冲突

### ⬛ none

- 容器没有网络，最隔离
- 可用于自定义网络拓扑，或做安全测试

### 🟨 overlay

- 跨宿主机网络，基于 VXLAN
- 依赖 Docker Swarm，自动配置加密隧道
- 多用于微服务或集群部署

### 🟧 macvlan

- 让容器获得独立的 IP（看起来像独立主机）
- 和宿主机网卡绑定（需指定子网、接口）
- 适合：容器接入局域网，集成旧系统

---

## ✅ 小练习

请你动手完成以下几个操作（用你自己的环境）：

1. 查看当前已有的 Docker 网络  
   ```bash
   docker network ls
   ```

2. 查看默认 bridge 网络的配置详情  
   ```bash
   docker network inspect bridge
   ```

3. 创建一个自定义 bridge 网络并验证  
   ```bash
   docker network create my-bridge-net
   docker network inspect my-bridge-net
   ```

4. 启动两个容器加入 `my-bridge-net`，尝试用 ping 连接对方：
   ```bash
   docker run -itd --name c1 --network my-bridge-net busybox sh
   docker run -itd --name c2 --network my-bridge-net busybox sh

   docker exec -it c1 sh
   ping c2
   ```

---

完成后告诉我效果如何，下一课我们就深入分析：**Bridge 模式背后的通信流程、iptables NAT、网络命名空间是怎么工作的**，从“能 ping 通”走向“理解为什么能 ping 通”。

你准备好后我就继续第二课 😎


太棒了！那我们进入 **第二课：Bridge 网络的工作原理**。这是理解 Docker 网络的关键一环。只要理解这一套机制，Docker 网络就不再是黑盒。

---

# 🧑‍🏫 第二课：Bridge 网络通信原理全解析

---

## 🌱 Bridge 网络结构图（概念理解）

假设你启动了一个容器 `c1`，指定使用 bridge 网络，它的底层结构如下：

```
[容器c1]
    |
[veth pair]             => 虚拟网卡对
    |
[vethXXXX] ------------> [docker0] --- [iptables SNAT] --- [eth0] --- [互联网]
                (Linux bridge)
```

**说明：**

- 每个容器启动时，Docker 会自动创建一个 **veth pair**（虚拟网卡对）
- 一端放进容器里（变成 eth0），另一端连接到 Docker 的默认网桥：`docker0`
- Docker 会使用 **iptables NAT** 做源地址转换，让容器能上网

---

## 🔬 核心概念详解

### 1. veth pair 是什么？

veth（virtual Ethernet）是一对成对存在的虚拟网卡：

- `vethX` 在容器网络命名空间
- `vethY` 在宿主机网络命名空间（连接 docker0）
- 数据从一端进去，从另一端出来（像数据隧道）

你可以这样查看：

```bash
ip link     # 查看网卡设备
```

你会看到很多 veth 名称的网卡，它们就是容器的“尾巴”。

---

### 2. docker0 是什么？

`docker0` 是一个 Linux bridge，类似一个软件交换机。

多个容器通过虚拟网卡连接到这个交换机上，实现容器间互联。

你可以查看：

```bash
brctl show    # 查看 Linux bridge（如无安装用 apt install bridge-utils）
```

或者：

```bash
ip addr show docker0
```

你会看到它通常有一个 172.17.0.1 的地址，是桥的网关。

---

### 3. 容器上网靠什么？

容器发出的数据包走的路径是：

```
容器 eth0 -> veth -> docker0 -> iptables SNAT -> eth0 -> 外网
```

Docker 自动设置了 `iptables` 规则进行 NAT 转换：

```bash
iptables -t nat -L -n
```

你会看到类似这一条规则：

```
MASQUERADE  all  --  172.17.0.0/16  !172.17.0.0/16
```

意思是：来自 172.17.0.x 的包要做 SNAT，转换成宿主机 IP。

---

## 🛠️ 实战演示

我们来验证刚才讲的内容。

### 1. 查看容器的 veth 接口

```bash
docker run -itd --name c3 --network bridge busybox sh
pid=$(docker inspect -f '{{.State.Pid}}' c3)
nsenter -t $pid -n ip addr show eth0
```

这表示进入容器的网络命名空间，查看 eth0。

### 2. 在宿主机找对应的 veth 接口：

```bash
ip link
```

你可以找到 vethXXXXX 接口状态是 `@ifXXX`，表示另一端连在容器里。

---

## ✅ 小练习

1. 用 `nsenter` 或 `ip netns` 查看容器内部的网络设置
2. 用 `brctl` 或 `ip link` 查看容器是否连在 docker0 上
3. 用 `tcpdump -i docker0` 抓包，看容器的 ping 请求流过 bridge（可选）

---

完成后告诉我进展如何，下一课我们将进入 **自定义 bridge 网络、子网设置、别名解析、与 DNS 的关系** —— 这部分很实用，尤其适合微服务或多容器应用部署。

继续吗？😎

太棒了！你进步很快👍 我们继续进入：

---

# 🧑‍🏫 第三课：自定义 Bridge 网络、容器间 DNS 名称解析、别名与多网络连接

这是开发部署中使用最多的一种网络实践，比如使用 `docker-compose`、多容器服务通信等。

---

## 🎯 本课目标：

1. 创建自定义 bridge 网络
2. 理解 Docker 的内建 DNS 功能
3. 使用别名 alias
4. 容器加入多个网络

---

## 📘 背景知识

Docker 默认的 `bridge` 网络并**不提供自动 DNS 容器名解析功能**。你需要创建**自定义的 bridge 网络**才会启用 Docker 内建的 DNS 服务，让容器之间可以用名称通信。

---

## 🌱 1. 创建自定义 bridge 网络（带子网）

```bash
docker network create \
  --driver bridge \
  --subnet 192.168.100.0/24 \
  --gateway 192.168.100.1 \
  my-custom-net
```

你可以通过 `docker network inspect my-custom-net` 查看它的网络详情。

---

## 🛠️ 2. 测试 DNS 名称解析

启动两个容器：

```bash
docker run -itd --name web1 --network my-custom-net busybox sh
docker run -itd --name web2 --network my-custom-net busybox sh
```

然后在 `web1` 中 ping `web2`：

```bash
docker exec -it web1 sh
ping web2
```

✅ 如果你能 ping 通，说明容器间通过 Docker 的 **内建 DNS 服务** 已经工作了。

你甚至可以查看 `/etc/resolv.conf`：

```bash
cat /etc/resolv.conf
```

里面的 nameserver 通常指向 Docker 的 DNS（例如 `127.0.0.11`）。

---

## 🧩 3. 使用容器别名（alias）

有时你希望同一个容器在网络中被多个名字识别，比如服务发现或负载均衡场景。

```bash
docker network create my-alias-net

docker run -itd \
  --name backend \
  --network my-alias-net \
  --network-alias api \
  --network-alias service \
  busybox sh
```

现在，你可以从其他容器中用 `api` 或 `service` 都能找到 `backend` 容器。

---

## 🌀 4. 多网络连接（高级）

Docker 容器可以连接多个网络（比如前端网 + 后端网）：

```bash
docker network create net-frontend
docker network create net-backend

docker run -itd --name myapp --network net-frontend busybox sh
docker network connect net-backend myapp
```

此时容器 `myapp` 同时出现在两个网络中，有两个 IP 地址。你可以 `docker inspect myapp` 查看。

---

## ✅ 小练习

1. 创建一个自定义网络 `my-net`，子网为 `192.168.88.0/24`
2. 启动两个容器 `a1`, `a2` 加入 `my-net`
3. 在 `a1` 中 ping `a2`，验证 DNS 是否解析成功
4. 给 `a2` 设置别名 `hello`，并尝试在 `a1` 中 ping `hello`
5. 启动一个容器连接两个网络，验证是否拥有多个 IP

---

下节我们将进入：

---

## 🔜 第四课：Host 网络 + 宿主机通信技巧 + 端口映射背后原理（iptables DNAT）

这是最常见的“容器访问外部”与“外部访问容器”场景，我们会解释如何精确控制端口暴露、安全配置等。

你完成练习后随时告诉我，我们继续！💪


你学得非常棒，咱们继续🚀！进入实战中最常遇到的一节：

---

# 🧑‍🏫 第四课：Host 网络、容器访问宿主机、端口映射与 iptables 原理全解

---

## 🎯 本课目标

1. 理解 `--network host` 模式的作用与原理  
2. 容器如何访问宿主机服务？反过来如何访问容器？  
3. 理解 Docker 的 `-p` 端口映射机制（iptables DNAT 实现）  
4. 掌握访问与调试的技巧，避免踩坑

---

## 🌐 1. Host 网络模式：共享宿主机网络

我们来看最“裸”的网络模式：

```bash
docker run -it --rm --network host busybox sh
```

🔍 它的特点是：

| 特性                    | 说明 |
|-------------------------|------|
| 没有虚拟网卡或桥接      | 不走 `docker0`，不分配独立 IP |
| 容器直接共享宿主网络栈  | 与宿主机共用 IP、端口 |
| 启动快、延迟低          | 非常适合性能敏感型应用（如 DNS、代理） |
| **端口冲突风险高！**    | 容器和宿主机不能绑定相同端口 |

你可以在容器内运行 `ip addr show`，会发现容器直接继承了宿主机的网卡信息，比如 `eth0`, `lo` 等。

---

## 🏠 2. 容器访问宿主机服务

### ✅ 推荐做法（Linux）：

使用宿主机的 **真实 IP 地址**，比如：

```bash
ping 192.168.1.10  # 宿主机 IP
curl http://192.168.1.10:8080
```

Docker 并不默认把 `localhost` 映射到宿主机。

---

### ⚠️ 跨平台说明：

| 平台     | 宿主机访问方式 |
|----------|----------------|
| Linux    | 宿主机真实 IP |
| macOS    | `host.docker.internal` |
| Windows  | `host.docker.internal` |

---

## 🚪 3. 端口映射 `-p` 的背后秘密

举个例子：

```bash
docker run -d -p 8080:80 nginx
```

这是最常见的方式，把容器的 80 端口映射到宿主机的 8080。

### 💡 实际发生了什么？

Docker 自动为你添加了一条 `iptables` 规则：

```bash
iptables -t nat -L -n
```

你会看到类似这样的 DNAT 规则：

```
DNAT  tcp  --  0.0.0.0/0  -> 172.17.0.2:80
```

📌 说明：

- `-p 8080:80` 其实是：
  - 监听宿主机的 8080 端口
  - 把进入该端口的请求重定向到容器的 172.17.x.x:80
- 这是通过 **iptables 的 NAT 表的 DNAT 规则** 实现的

---

## 🔧 4. 多端口映射、绑定特定 IP

你可以指定多个端口：

```bash
docker run -p 8080:80 -p 443:443 nginx
```

或者只绑定本地 127.0.0.1：

```bash
docker run -p 127.0.0.1:8080:80 nginx
```

这样外部网络无法访问，只能本地访问，提升安全性。

---

## 🧪 小练习

1. 启动一个 busybox 容器，用 `--network host` 模式，看它是否能 ping 宿主机的外网
2. 用 `-p` 启动一个 nginx 容器，映射到宿主的 `8888` 端口，访问测试
3. 查看 `iptables -t nat -L -n`，观察是否自动添加了 DNAT 规则
4. 把 nginx 映射到 `127.0.0.1:8888`，验证只能本机访问

---

## 🔐 提示：不使用 -p 的情况如何访问容器服务？

使用 Docker 的容器 IP 地址访问：

```bash
docker inspect <容器名或ID> | grep IPAddress
```

如果你知道 IP（比如 `172.17.0.5`），可以直接：

```bash
curl http://172.17.0.5:80
```

前提：你在宿主机、且容器在 bridge 网络中。

---

## 🧠 小结

| 模式           | 是否有独立 IP | DNS 支持 | 是否能端口复用 | 推荐用途              |
|----------------|---------------|----------|----------------|-----------------------|
| bridge         | ✅ 有         | ❌（默认）✅（自定义网络） | ✅                  | 默认、安全、推荐     |
| host           | ❌ 无         | 宿主相同 | ❌（会冲突）    | 性能敏感、裸跑服务   |
| none           | ❌ 无         | ❌        | 无              | 安全隔离或自定义网络栈 |
| overlay        | ✅（Swarm）   | ✅        | ✅              | 多主机容器通信       |

---

准备好进入下一课了吗？

---

## 🔜 第五课：Overlay 网络与多主机容器通信（Swarm / Kubernetes 基础）

我们将进入多主机网络 —— 这是微服务部署不可缺的一环。

你准备好，我就开讲！🔥


太好了！你已经具备了构建 Docker 网络的核心能力，现在我们将进入：

---

# 🧑‍🏫 第五课：Overlay 网络与多主机容器通信（Swarm 实战）

---

## 🎯 本课目标：

1. 理解 Overlay 网络的用途与工作原理  
2. 使用 Docker Swarm 创建多主机网络  
3. 多节点容器之间通过服务名通信  
4. Overlay 网络与 ingress、VIP、DNS 负载均衡的配合

---

## 🧠 1. 什么是 Overlay 网络？

Overlay 网络允许多个 Docker 主机（不同物理机或云主机）之间的容器通信，就像它们在同一个二层网络中一样。

它通过 **VXLAN** 技术将网络封装成隧道，在宿主机之间传输数据包。

---

## 📦 2. 使用 Swarm 创建 Overlay 网络（本地模拟也行）

首先初始化 Swarm 集群（哪怕就你一台机子）：

```bash
docker swarm init
```

然后创建一个 Overlay 网络：

```bash
docker network create \
  --driver overlay \
  --attachable \
  --subnet 10.10.10.0/24 \
  my_overlay_net
```

- `--attachable` 允许用普通 `docker run` 加入（非服务也能加入）
- `--driver overlay` 指定使用 Overlay 网络驱动

---

## 🧪 3. 在 Overlay 网络中部署服务并通信

创建两个服务：

```bash
docker service create --name nginx1 \
  --network my_overlay_net \
  nginx

docker service create --name nginx2 \
  --network my_overlay_net \
  busybox sleep 10000
```

现在你可以进入 nginx2：

```bash
docker exec -it $(docker ps -qf name=nginx2) sh
ping nginx1
```

✅ 成功了！你已经通过 Overlay 网络连接两个服务，**跨主机也是一样的**。

---

## 🌐 4. 服务名 = DNS 名（Swarm DNS 负载均衡）

Swarm 给每个服务分配一个 **虚拟 IP（VIP）**，并自动建立 DNS 映射：

```bash
nslookup nginx1
```

Docker 会自动把 `nginx1` 映射到该服务的 VIP 地址，然后通过内部的负载均衡机制将请求转发到真正的容器副本。

---

## 🔁 5. 多副本与内建负载均衡

```bash
docker service scale nginx1=3
```

现在 `nginx1` 有 3 个副本，当你从其他服务 ping 或 curl 时，会被自动轮询分发（VIP 模式）。

---

## 🔐 Overlay 网络通信的前提条件（多主机环境）：

> 这在生产环境很关键！

1. 各节点要能互通 TCP 2377（Swarm 控制）、7946（服务发现）、4789（VXLAN）
2. 多节点间要有互信（默认用 TLS 认证）
3. 节点不能被 NAT 隔离（Cloud VM 设置要注意）
4. 必须使用 Swarm 管理的服务（普通容器不能横跨主机）

---

## 🧪 小练习（可本地模拟）

1. 初始化 Swarm，创建 Overlay 网络 `swarm-net`
2. 创建 `api` 和 `db` 两个服务加入该网络
3. 尝试从 `api` ping `db`
4. 将 `api` 副本数扩大至 3，观察负载均衡行为
5. 使用 `docker network inspect` 查看 Overlay 网络的内部结构

---

## 🔄 总结

| 特性               | Bridge 网络   | Overlay 网络     |
|--------------------|----------------|-------------------|
| 是否支持多主机     | ❌             | ✅                |
| 容器是否有独立 IP  | ✅             | ✅（Swarm 内部分配）|
| 是否支持服务名通信 | ❌（需配置）   | ✅（自动支持）     |
| 是否支持负载均衡   | ❌             | ✅（VIP 模式）     |

---

下一课我们将进入：

---

## 🔜 第六课：Macvlan 网络，容器直通物理网段（容器变“真主机”）

这适用于容器 **直接获取局域网 IP**（如 192.168.1.x），和真实物理主机一样能被访问，非常适合对外暴露、传统集成或 IoT 场景。

你准备好进入更强网络魔法了吗？✨


好，**第六课** 来啦！我们正式进入 Docker 网络中最“贴近物理世界”的那一层：

---

# 🧭 第六课：Macvlan 网络，让容器“上户口”进真实局域网

## 📌 课程目标

- 理解 Macvlan 网络的原理
- 掌握如何配置 Macvlan，让容器获取真实局域网 IP（如 192.168.1.100）
- 能够用 Macvlan 打通和物理主机、外部设备的直接通信
- 了解其限制与调试方法

---

## 🧠 一、Macvlan 网络的原理

Macvlan 网络允许每个容器拥有：

- 自己的 MAC 地址（虚拟）
- 局域网 IP（例如：192.168.1.200）
- 独立于宿主机的“网络身份”

它的工作方式是：

- 宿主机上的物理网卡（如 `eth0`）被“劈”成多个虚拟子接口
- 每个容器通过这些子接口独立接入局域网

**场景举例：**
- 你有一台宿主机 IP 是 `192.168.1.10`
- 你想让某容器直接使用 `192.168.1.20`，局域网中其他设备可以直接访问它

---

## 🛠️ 二、Macvlan 网络配置步骤（示例：192.168.1.0/24 网段）

### 🔧 步骤 1：创建 Macvlan 网络

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  macvlan_net
```

解释：

| 参数 | 含义 |
|------|------|
| `-d macvlan` | 使用 macvlan 驱动 |
| `--subnet` | 指定子网 |
| `--gateway` | 子网网关（通常是你的路由器 IP） |
| `-o parent=eth0` | 指定物理网卡（非常重要） |

> 🚨 注意：**eth0** 必须是真正连接局域网的接口（桥接、物理口等）

---

### 🐳 步骤 2：启动容器并接入 Macvlan 网络

```bash
docker run -dit \
  --name my-nginx \
  --network macvlan_net \
  nginx
```

然后你可以用：

```bash
docker inspect my-nginx | grep IPAddress
```

你将看到一个局域网 IP，如：

```bash
"IPAddress": "192.168.1.200",
```

💡这时你的路由器上甚至会显示这个容器的“设备”。

---

### ✅ 步骤 3：从局域网设备访问容器

你可以从你家里或办公网的其他设备直接访问：

```bash
curl http://192.168.1.200
```

✅ **它和普通主机无异！**

---

## 🧱 三、Macvlan 的限制与注意事项

| 限制点 | 说明 |
|--------|------|
| ❌ 宿主机无法访问容器 | 默认情况，宿主机不能 ping/访问 Macvlan 容器 |
| 🔁 可通过 `macvlan+bridge` workaround 解决 | 稍后介绍 |
| 👀 物理网卡必须支持 Promiscuous Mode | 一些 VPS / 云厂商不支持 |
| 🏠 适合局域网场景 | 如内网服务发布、IoT 网关等 |

---

## 🧪 四、进阶：让宿主机也能访问 Macvlan 容器

### 方法：创建一个 Macvlan 子接口（host 用）

```bash
# 创建一个新的 macvlan 子接口
ip link add macvlan0 link eth0 type macvlan mode bridge

# 给它分配宿主机局域网内 IP
ip addr add 192.168.1.99/24 dev macvlan0

# 启用接口
ip link set macvlan0 up
```

然后宿主机就能访问 Macvlan 容器了：

```bash
curl http://192.168.1.200
```

---

## 🔍 五、调试与验证

| 工具 | 用法 |
|------|------|
| `docker inspect` | 查看容器 IP |
| `ip a`, `ip link` | 查看物理和虚拟接口 |
| `ping`, `curl`, `tcpdump` | 验证网络通路 |
| `arp -a` | 看看容器是否在局域网设备中注册了 |

---

## 🧑‍🏫 六、你可以动手试试这些实验

1. 用 Macvlan 让多个容器分别拥有 `192.168.1.101`、`192.168.1.102`
2. 用 Wireshark/tcpdump 捕捉它们的 ARP 广播和回应
3. 在你的家用路由器中看看这些容器是否显示为独立设备

---

是否需要我演示如何结合 `docker-compose` 来使用 Macvlan？  
还是你更希望进入第七课，了解 Swarm Ingress 负载均衡网络？

太棒了，准备好进入 Docker 网络进阶的核心应用！

---

# ✅ 第七课：Docker Compose 中定义网络与多服务依赖关系管理

当你的服务不再是一个容器，而是多个组件（如前端 + 后端 + 数据库），你就需要 Docker Compose 来管理它们的网络关系。

---

## 🧱 一、Compose 中的网络作用

在 `docker-compose.yml` 中，我们可以自定义网络，控制服务之间：

- 是否能互相通信
- 使用什么子网和网段
- 是否暴露给外部
- 是否连接到外部的 Docker 网络（比如 Macvlan/overlay）

---

## 📐 二、Compose 网络基础结构

```yaml
version: "3.8"
services:
  web:
    image: nginx
    networks:
      - frontend
  app:
    image: myapp
    networks:
      - frontend
      - backend
  db:
    image: mysql
    networks:
      - backend

networks:
  frontend:
  backend:
```

### 🔍 说明：

| 名称 | 说明 |
|------|------|
| `frontend` 网络 | `web` 和 `app` 在同一网络中，互相能访问 |
| `backend` 网络 | `app` 和 `db` 互通，但 `web` 无法访问数据库 |

---

## 📡 三、查看 Compose 网络

部署后，可以通过以下方式查看网络：

```bash
docker network ls
docker network inspect <compose_project>_<network_name>
```

默认网络名字形如：`myproject_frontend`

---

## 💬 四、容器间如何通信？

在同一个网络内，容器可以直接通过服务名通信：

- `app` 容器内访问数据库：`mysql://db:3306`
- `web` 容器访问后端：`http://app:8080`

---

## 🧪 五、实战小练习

你可以用以下 YAML 快速部署一个 `nginx + flask + redis` 的示例：

```yaml
version: "3.8"
services:
  web:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend
  flask:
    image: myflaskapp
    networks:
      - frontend
      - backend
  redis:
    image: redis
    networks:
      - backend

networks:
  frontend:
  backend:
```

> 在 flask 中使用：`redis = Redis(host="redis", port=6379)`

---

## 🔄 六、网络别名与连接外部网络

你还可以：

- 给服务加 `aliases`，让它有多个 DNS 名
- 使用 `external: true` 接入已有网络（如 overlay）

---

## ⏭️ 下一节课预告

> **第八课：Compose 多项目网络互联（跨 docker-compose.yml 互通）**

你是否想让多个 Compose 项目彼此通信？下一节课我们将讲解如何打通多个独立项目的网络边界。

---

是否现在进入第八课？或者你想动手实操一下 Compose 网络定义？我可以为你定制一个练习项目 😎

太好了，**第八课**将带你掌握多个 Docker Compose 项目之间 **网络互通** 的技能 —— 这是微服务架构下很常见也非常实用的能力。

---

# 🧭 第八课：Docker Compose 多项目网络互联（跨 Compose 文件通信）

当你把前端、后端、数据库拆成多个项目，分别在不同的 `docker-compose.yml` 中管理，默认它们是**互相隔离的**，**网络不通**。

这一节课教你——如何打破这一隔离，实现多个 Compose 项目的容器互通。

---

## 🧩 一、为什么默认不能通信？

Docker Compose 会默认为每个项目创建独立的网络，比如：

- 项目 A 会创建：`projecta_default`
- 项目 B 会创建：`projectb_default`

容器只能访问自己网络内的服务，**即使你端口没冲突，名字也对不上**。

---

## 🪄 二、解决方案：使用 **外部共享网络**

### 👇 核心操作步骤：

1. **手动创建一个共享网络**
2. **在多个 Compose 文件中引入这个网络**
3. **设置为 external 网络**

---

## 🛠️ 三、实战操作

### 🥇 第一步：手动创建一个网络

```bash
docker network create shared_net
```

> 可指定网段/IPAM，默认为 bridge 网络。

---

### 🥈 第二步：两个 Compose 项目共享这个网络

#### `app1/docker-compose.yml`

```yaml
version: "3.8"
services:
  backend:
    image: mybackend
    networks:
      - shared

networks:
  shared:
    external: true
```

#### `app2/docker-compose.yml`

```yaml
version: "3.8"
services:
  frontend:
    image: myfrontend
    networks:
      - shared

networks:
  shared:
    external: true
```

---

## 🧪 四、通信测试

启动两个项目：

```bash
cd app1 && docker compose up -d
cd ../app2 && docker compose up -d
```

进入 `frontend` 容器中：

```bash
docker exec -it app2_frontend_1 sh
# 测试能否访问 backend
curl http://backend:port
```

✅ 如果成功，说明多个项目打通了！

---

## 💡 五、注意事项

| 问题 | 解决方案 |
|------|----------|
| 服务名冲突 | 尽量用唯一的服务名 |
| 网络未创建 | Docker Compose 会报错，必须手动先建好 external 网络 |
| 跨主机 Swarm 模式？ | 使用 overlay 网络 + `attachable: true`（进阶内容） |

---

## 🧠 拓展练习建议

- 自己创建两个项目：`api` 和 `web`
- api 提供 HTTP 接口，web 通过 axios 调用 api
- 两个 Compose 各自独立，但共享网络 `shared_net`

我可以为你提供这个例子模板，需要吗？

---

📘 下一课预告：

> **第九课：深入理解容器之间 DNS 解析、服务发现原理、VIP 与 DNS Round Robin 的关系**  
> 比如：`curl backend` 背后到底发生了什么？你真的知道容器是如何找到彼此的吗？

是否继续进入第九课？还是要动手练习一下？我都可以陪你搞定 😎

太棒了！我们正式进入 Docker 网络进阶系列的——

# 🧠 第九课：**Docker 容器中的服务发现机制与 DNS 背后的秘密**

> 你可能经常在容器里使用 `curl backend:8080` 访问服务，但有没有想过：
>
> - `backend` 是怎么解析成 IP 的？
> - 多副本服务背后是不是多个 IP？
> - 这些 IP 是 VIP 还是容器真实 IP？
> - 它用的是 DNS 吗？什么时候会轮询？

今天我们就一探究竟！

---

## 🧩 一、Docker 服务发现基础原理

在 **默认网络（如 bridge、overlay）** 中，Docker 自带一个 **内置 DNS 服务**，会自动：

- 把容器服务名注册到 DNS 中
- 支持使用服务名相互访问（例如 `curl backend`）
- 支持 DNS 轮询（Round Robin）

🔧 前提是容器在**同一个网络**中！

---

## 🌐 二、单机 vs Swarm 模式的区别

| 模式        | DNS 作用目标        | IP 类型                    | 备注                           |
|-------------|---------------------|----------------------------|--------------------------------|
| Docker 单机 | 容器名 → 容器 IP     | 真实容器 IP（172.x）       | 一对一映射                     |
| Docker Swarm | 服务名 → VIP or 多容器 IP | 虚拟 IP（VIP）或多个容器 IP | 内部负载均衡，服务发现更智能 |

---

## 🎯 三、VIP 和 DNS Round-Robin

### 1️⃣ Swarm 默认行为是 **VIP + IPVS**

- 每个服务（比如 `nginx`）会分配一个 **虚拟 IP（VIP）**。
- 所有容器请求 `nginx`，其实是请求 VIP。
- VIP 会被映射到后端多个容器上，通过 **IPVS** 做负载均衡。

🔍 查看 VIP：

```bash
docker service inspect nginx --format '{{json .Endpoint.VirtualIPs}}' | jq
```

---

### 2️⃣ 设置 DNS Round Robin（非 VIP 模式）

如果你不想要 VIP，而是希望容器能直接拿到多个容器的 IP（比如每次访问不同 IP），可以这么做：

```bash
docker service create \
  --name testsvc \
  --network my_overlay_net \
  --endpoint-mode dnsrr \
  nginx
```

然后你在其他容器中：

```bash
nslookup testsvc
# 或 dig testsvc
```

会得到多个 IP！（每个任务对应一个）

---

## 🔎 四、实战演示指令

```bash
# 1. 创建 overlay 网络
docker network create --driver overlay --attachable my_overlay_net

# 2. 创建服务（使用 dnsrr 模式）
docker service create --replicas 3 --name web \
  --network my_overlay_net \
  --endpoint-mode dnsrr \
  nginx

# 3. 启动临时 busybox 容器
docker run --rm -it --network my_overlay_net busybox

# 4. 容器中执行 nslookup
nslookup web
```

如果你看到多个 IP → 成功！🎉

---

## 📌 五、调试与查看方式汇总

| 工具 | 用途 |
|------|------|
| `nslookup` / `dig` | 查看服务名对应的 IP |
| `docker service inspect` | 查看 VIP 配置 |
| `docker network inspect` | 查看网络中的容器 IP |
| `ipvsadm -Ln`（宿主机） | 查看 IPVS 路由表（Swarm VIP 模式） |
| `tcpdump port 53` | 抓 DNS 包 |

---

## ✅ 小结

Docker 网络中的服务发现是：

- 基于 DNS 的（内置 DNS 服务）
- 支持服务名 → IP 的解析
- Swarm 中可以选择 VIP 模式 or DNS RR 模式
- VIP 模式下借助 **IPVS** 实现负载均衡

掌握这个机制，你才能更灵活、可控地设计微服务！

---

🎓 第十课预告：

> **Ingress 网络与全局负载均衡 —— Swarm 集群统一入口的魔法**

是否进入第十课？或者你想实际测试一下 `VIP` vs `DNSRR` 效果，我也可以手把手指导你操作体验。💡

太好了！我们现在进入集群网络架构的核心内容——

# 🧭 第十课：Ingress 网络 与 Swarm 集群的统一入口负载均衡机制

> 这一课将揭开 Docker Swarm 在外部访问时，**是如何将请求路由给后端服务的容器副本的**——这就是 Ingress 网络的作用！

---

## 🌐 一、Ingress 网络 是什么？

当你运行：

```bash
docker service create --name web -p 80:80 nginx
```

你并没有写 IP，也没有选择网络，但 Swarm 却可以让 **集群中任何节点的 80 端口** 对应到 nginx 容器，这是因为：

➡️ **Swarm 自动创建并使用了一个叫 `ingress` 的 overlay 网络。**

这个网络的功能是：  
✅ 接收客户端访问（绑定主机端口）  
✅ 自动把请求转发到集群中某个副本上

---

## 🧩 二、Ingress 网络工作机制

### 核心组件：
- **VIP（Virtual IP）**：服务入口地址
- **IPVS**：在 Manager 节点通过 Linux IPVS 模拟 L4 负载均衡
- **`ingress` 网络**：所有参与负载的服务任务都要连接到这个网络

### 请求流转路径：
1. 客户端访问某个节点的 `<IP>:<端口>`
2. Docker 监听主机端口，通过 `iptables` NAT 将请求导入 ingress 网络
3. ingress 网络中的 `routing mesh` + `IPVS` 将流量导向某个服务副本

🌀 **无论你访问哪台机器，只要端口开放，请求就会被转发！**

---

## 🧪 三、实战演示：体验 Ingress 网络的“魔法”

### 步骤 1：部署服务并暴露端口

```bash
docker service create --name demo-web \
  --replicas 3 \
  --publish published=8080,target=80 \
  nginx
```

➡️ `published=8080` 是宿主机监听端口  
➡️ `target=80` 是容器中的端口

### 步骤 2：查看网络情况

```bash
docker service ps demo-web
docker network inspect ingress
```

注意：所有容器都连到了 `ingress` 网络！

### 步骤 3：在任意 Swarm 节点访问

```bash
curl http://localhost:8080
```

你会发现：  
不管副本在不在本机，**请求都成功命中了！**

➡️ 请求被 Swarm 网络“魔法”地转发到了正确的副本

---

## 🧠 四、Routing Mesh 与 VIP 的关系

| 名称 | 功能 |
|------|------|
| VIP | 虚拟服务 IP，在 `ingress` 网络内 |
| Routing Mesh | 所有 Swarm 节点共享的请求转发机制 |
| IPVS | 提供 VIP 到容器的负载均衡（在 Swarm manager 节点上可见） |

你可以在 manager 节点上运行：

```bash
ipvsadm -Ln
```

查看类似：

```
TCP 10.0.0.2:80 rr
  -> 10.0.0.5:80 ...
  -> 10.0.0.6:80 ...
```

---

## ⚠️ 五、一些注意事项

- `--publish` 才会走 Ingress 网络，**`--network` 自定义 overlay 并不会触发 Routing Mesh**
- 只能在 **Swarm 服务（`docker service create`）** 中使用
- 默认是 **VIP 模式**，可以改为 `--endpoint-mode dnsrr`（但就失去 ingress）
- 若节点无副本，也能接受请求（但要保证 overlay 网络互通）

---

## 📌 六、相关调试指令

| 命令 | 用途 |
|------|------|
| `docker service ls` | 查看服务 |
| `docker service inspect` | 查看 VIP、端口 |
| `docker network inspect ingress` | 查看 ingress 网络结构 |
| `ipvsadm -Ln` | 查看 VIP 到副本的映射（只在 manager 节点） |
| `iptables -t nat -L -n` | 查看端口映射 |
| `ss -tlnp` | 查看宿主机监听的端口 |

---

## ✅ 小结

Docker Swarm 的 Ingress 网络让：

- 外部访问只需指定任何节点 + 端口
- 请求自动分发到后端容器
- 后端副本分布在哪都能被命中（routing mesh）

这是 Swarm 的重要特性之一，也为自动扩缩容、高可用打下基础！

---

🎓 **下一课预告（第十一课）**：

> 🔒 Docker 网络安全：如何限制容器之间的访问？overlay 防火墙策略怎么做？

如果你准备好了，我可以带你进入网络安全与隔离策略的实战篇章 🔐💥