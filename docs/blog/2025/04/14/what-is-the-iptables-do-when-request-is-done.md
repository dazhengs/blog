---
date: 2025-04-14
---
# 一条 Web 请求的生死劫：我只是想进个容器，为什么这么难？

话说有一天，小白鼠工程师小李正在调试一个部署在 Docker 容器里的 Web 服务。

“奇怪，客户端发请求到了宿主机的 8080 端口，但容器怎么像装死一样没反应？”

小李的脑海里突然浮现出一个字母——**iptables**！

于是，一场追踪请求“失踪”事件的冒险正式展开。



## 第一章：请求上路了

我们的主角——**请求君**，从遥远的客户端启程，目标是宿主机的 `192.168.1.100:8080`。

“兄弟们！前方就是目的地了，走你！”

谁知道刚到宿主机的网卡，**iptables 的第一道大门**就拦住了它：

> 👮「站住！欢迎来到 **PREROUTING 站**，报上来意！」

这个 PREROUTING，是 `nat` 和 `mangle` 表的地盘，专门用来在“还没决定去哪儿”前修改包的目标地址，PREROUTING 大哥执行 `sudo iptables -t nat -L PREROUTING -n -v` 检查了自己的规则表，发现以下输出：

```sh
Chain PREROUTING (policy ACCEPT 7107 packets, 439K bytes)
 pkts bytes target     prot opt in     out     source               destination
2827K 2729M PREROUTING_direct  all  --  *      *       0.0.0.0/0            0.0.0.0/0
2827K 2729M PREROUTING_ZONES_SOURCE  all  --  *      *       0.0.0.0/0            0.0.0.0/0
2827K 2729M PREROUTING_ZONES  all  --  *      *       0.0.0.0/0            0.0.0.0/0
12434   15M DOCKER     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ADDRTYPE match dst-type LOCAL
```

>旁白，这里数据包会依次经过PREROUTING_direct → PREROUTING_ZONES_SOURCE → PREROUTING_ZONES → DOCKER，真正决定 Docker 端口映射重定向的，是最后那个 DOCKER 链里的 DNAT 规则，前面的几个链大多数情况下只是 iptables 设置的一些钩子（有的甚至是空链），没有改变数据包的行为


嗯，目标地址 192.168.1.100 属于 `dst-type LOCAL`，符合 target 是 DOCKER 那条：
```
12434   15M DOCKER     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ADDRTYPE match dst-type LOCAL
```
嗯，PREROUTING 大哥对请求君说，从这条路去 DOCKER 部门吧，它会接待你。

于是请求君一转，到达了 DOCKER 部门，执勤人员检查了请求君的目标，执行 `sudo iptables -t nat -L DOCKER -n -v`查看了自己的地图，最面前有一条命中：

```sh
Chain DOCKER (2 references)
 pkts bytes target     prot opt in     out     source               destination
......
 2011  960K DNAT       tcp  --  !br-b0c517f00f7e *       0.0.0.0/0            0.0.0.0/0            udp tcp:8080 to:172.17.0.2:80
......
```
DOCKER 执勤人员打开了魔法传送门，于是请求君被瞬间吸入，目标地址瞬间变成了容器的 `172.17.0.2:80`。

“哇，这操作有点骚啊，我被转发了？！”



## 第二章：不是我，是他！

原本请求君以为自己要进宿主机大本营——**INPUT 链**，结果守门的老大爷看了下目标地址说：

> 👴「你目标不是我（宿主机），走前面 FORWARD 去！」

于是请求君屁颠屁颠跑去找 **FORWARD 链**。

“你谁啊？”FORWARD 链的门卫一边问一边输入了 `sudo iptables -t filter -L FORWARD -n -v --line-numbers` 检查自己的知识库。
```sh
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1    6255K 3571M DOCKER-USER  all  --  *      *       0.0.0.0/0            0.0.0.0/0
2    6255K 3571M DOCKER-ISOLATION-STAGE-1  all  --  *      *       0.0.0.0/0            0.0.0.0/0
3     2331   11M ACCEPT     all  --  *      br-2d4bb77021ed  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
4        8   512 DOCKER     all  --  *      br-2d4bb77021ed  0.0.0.0/0            0.0.0.0/0
5     2208  767K ACCEPT     all  --  br-2d4bb77021ed !br-2d4bb77021ed  0.0.0.0/0            0.0.0.0/0
6        0     0 ACCEPT     all  --  br-2d4bb77021ed br-2d4bb77021ed  0.0.0.0/0            0.0.0.0/0
7        0     0 ACCEPT     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
8        0     0 DOCKER     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0
9        0     0 ACCEPT     all  --  docker0 !docker0  0.0.0.0/0            0.0.0.0/0
10       0     0 ACCEPT     all  --  docker0 docker0  0.0.0.0/0            0.0.0.0/0
11    1388  290K ACCEPT     all  --  *      br-d83e6d28651d  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
12      26  1664 DOCKER     all  --  *      br-d83e6d28651d  0.0.0.0/0            0.0.0.0/0
13     481 2351K ACCEPT     all  --  br-d83e6d28651d !br-d83e6d28651d  0.0.0.0/0            0.0.0.0/0
14       0     0 ACCEPT     all  --  br-d83e6d28651d br-d83e6d28651d  0.0.0.0/0            0.0.0.0/0
15    136K   26M ACCEPT     all  --  *      br-b698f8563bdc  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
16   44043 2643K DOCKER     all  --  *      br-b698f8563bdc  0.0.0.0/0            0.0.0.0/0
17    106K 7371K ACCEPT     all  --  br-b698f8563bdc !br-b698f8563bdc  0.0.0.0/0            0.0.0.0/0
18       0     0 ACCEPT     all  --  br-b698f8563bdc br-b698f8563bdc  0.0.0.0/0            0.0.0.0/0
19   42130 4284K ACCEPT     all  --  *      br-fde74ea0e059  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
20      69  4216 DOCKER     all  --  *      br-fde74ea0e059  0.0.0.0/0            0.0.0.0/0
21   38276   24M ACCEPT     all  --  br-fde74ea0e059 !br-fde74ea0e059  0.0.0.0/0            0.0.0.0/0
22       0     0 ACCEPT     all  --  br-fde74ea0e059 br-fde74ea0e059  0.0.0.0/0            0.0.0.0/0
23   8665K 3572M ACCEPT     all  --  *      br-9824e4d57d75  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
24   1059K 1024M DOCKER     all  --  *      br-9824e4d57d75  0.0.0.0/0            0.0.0.0/0
25    364K 1213M ACCEPT     all  --  br-9824e4d57d75 !br-9824e4d57d75  0.0.0.0/0            0.0.0.0/0
26   24985 1499K ACCEPT     all  --  br-9824e4d57d75 br-9824e4d57d75  0.0.0.0/0            0.0.0.0/0
27       0     0 ACCEPT     all  --  *      br-65bf5aba02eb  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
28       0     0 DOCKER     all  --  *      br-65bf5aba02eb  0.0.0.0/0            0.0.0.0/0
29       0     0 ACCEPT     all  --  br-65bf5aba02eb !br-65bf5aba02eb  0.0.0.0/0            0.0.0.0/0
30       0     0 ACCEPT     all  --  br-65bf5aba02eb br-65bf5aba02eb  0.0.0.0/0            0.0.0.0/0
31       0     0 ACCEPT     all  --  *      br-839f01e99257  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
32       0     0 DOCKER     all  --  *      br-839f01e99257  0.0.0.0/0            0.0.0.0/0
33       0     0 ACCEPT     all  --  br-839f01e99257 !br-839f01e99257  0.0.0.0/0            0.0.0.0/0
34       0     0 ACCEPT     all  --  br-839f01e99257 br-839f01e99257  0.0.0.0/0            0.0.0.0/0
35       0     0 ACCEPT     all  --  *      br-89d82a740b95  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
36       0     0 DOCKER     all  --  *      br-89d82a740b95  0.0.0.0/0            0.0.0.0/0
37      12   720 ACCEPT     all  --  br-89d82a740b95 !br-89d82a740b95  0.0.0.0/0            0.0.0.0/0
38       0     0 ACCEPT     all  --  br-89d82a740b95 br-89d82a740b95  0.0.0.0/0            0.0.0.0/0
39       0     0 ACCEPT     all  --  *      br-0a7f6c307f6b  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
40       0     0 DOCKER     all  --  *      br-0a7f6c307f6b  0.0.0.0/0            0.0.0.0/0
41       0     0 ACCEPT     all  --  br-0a7f6c307f6b !br-0a7f6c307f6b  0.0.0.0/0            0.0.0.0/0
42       0     0 ACCEPT     all  --  br-0a7f6c307f6b br-0a7f6c307f6b  0.0.0.0/0            0.0.0.0/0
43       0     0 ACCEPT     all  --  *      br-88230bfcf5fe  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
44       0     0 DOCKER     all  --  *      br-88230bfcf5fe  0.0.0.0/0            0.0.0.0/0
45       0     0 ACCEPT     all  --  br-88230bfcf5fe !br-88230bfcf5fe  0.0.0.0/0            0.0.0.0/0
46       0     0 ACCEPT     all  --  br-88230bfcf5fe br-88230bfcf5fe  0.0.0.0/0            0.0.0.0/0
47   27975 3929K ACCEPT     all  --  *      br-b0c517f00f7e  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
48    4641 2231K DOCKER     all  --  *      br-b0c517f00f7e  0.0.0.0/0            0.0.0.0/0
......
67       3   156 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate INVALID
68   17309 1083K REJECT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            reject-with icmp-host-prohibited
```

“我……我是要去容器找 Web 服务的。”

门卫从前往后查看知识库进行匹配，发现第48条规则命中：
```sh
48    4641 2231K DOCKER     all  --  *      br-b0c517f00f7e  0.0.0.0/0            0.0.0.0/0

```
原因是
>1. 入接口是 *（任意） 
>2. 出接口是 br-b0c517f00f7e（目标是容器）
>3. 所有协议都匹配（你是 TCP:8080）
>4. 被跳转到 DOCKER 链中进行更具体的容器匹配

然后对请求君说：“看你挺可爱的，Docker 给你开了绿灯，进去吧。”

FORWARD 链果然仁义，Docker 给它的确安排了放行规则，Docker 门卫执行 `sudo iptables -t filter -L DOCKER -n -v --line-numbers` 看了下自己的过滤规则：

```sh
Chain DOCKER (14 references)
num   pkts bytes target     prot opt in     out     source               destination
1      155  9352 ACCEPT     tcp  --  !br-b698f8563bdc br-b698f8563bdc  0.0.0.0/0            172.30.13.10         tcp dpt:8001
2        0     0 ACCEPT     tcp  --  !br-fde74ea0e059 br-fde74ea0e059  0.0.0.0/0            172.16.1.2           tcp dpt:8080
3     2035  969K ACCEPT     tcp  --  !br-b0c517f00f7e br-b0c517f00f7e  0.0.0.0/0            172.17.0.2           tcp dpt:80
......
```
发现应该走 3 号路，于是请求君顺利穿过大门，进入了 Docker 容器 `172.17.0.2` 的世界。



## 第三章：容器打工人上线

容器里的 Nginx 一看，有请求来啦，立刻干活！

“这活我熟，8080 映射我 80，对得上。返回数据！”



## 第四章：回家路上的伪装术

容器的响应数据背着大包小包踏上回程。

刚出门，又被一群守卫拦下——**POSTROUTING 链**！

> 👮「你来自容器 IP？出门得穿马甲！」

这时候 `nat` 表的 MASQUERADE 规则起了作用， POSTROUTING 的保安执行`sudo iptables -t nat -L POSTROUTING -n -v --line-numbers`查了下自己的规则库，发现第 8 条命中。

```sh
Chain POSTROUTING (policy ACCEPT 14242 packets, 10M bytes)
num   pkts bytes target     prot opt in     out     source               destination
1       76  4804 MASQUERADE  all  --  *      !br-2d4bb77021ed  172.30.14.0/24       0.0.0.0/0
2        0     0 MASQUERADE  all  --  *      !docker0  172.18.0.0/16        0.0.0.0/0
3        4   240 MASQUERADE  all  --  *      !br-d83e6d28651d  172.27.0.0/16        0.0.0.0/0
4       18  1092 MASQUERADE  all  --  *      !br-b698f8563bdc  172.30.13.0/24       0.0.0.0/0
5     1150 73654 MASQUERADE  all  --  *      !br-fde74ea0e059  172.16.1.0/24        0.0.0.0/0
6     1309 81086 MASQUERADE  all  --  *      !br-9824e4d57d75  177.7.0.0/24         0.0.0.0/0
7        2   120 MASQUERADE  all  --  *      !br-89d82a740b95  172.19.0.0/16        0.0.0.0/0
8     3509  211K MASQUERADE  all  --  *      !br-b0c517f00f7e  172.17.0.0/16        0.0.0.0/0
......
```

于是源地址`172.17.0.2`被“伪装”成宿主机发送该数据包时实际使用的出口网卡 IP 地址 即 `192.168.1.100`，防止客户端一看是个陌生 IP 直接拉黑。

“这就像快递员送完货后用发件人电话回电一样，稳妥！”



## 第五章：任务完成，返回人间

穿上马甲的响应包顺利出发，回到了客户端的怀抱。

客户端一看：哎，这服务不错，响应挺快！

殊不知，这一来一回，走了好几张表、过了三四道门。



## 尾声：iptables 的江湖地图

为了方便小李以后不再迷路，他画了张 

### **iptables 江湖通关图**：

```
【入方向】
Client -> Host NIC -> 
    [nat: PREROUTING (DNAT)] -> 
    [filter: FORWARD] -> 
    Container (Docker)

【出方向】
Container -> 
    [nat: POSTROUTING (MASQUERADE)] -> 
    Host NIC -> 
    Client
```

也总结了 iptable 四张表的用途：

###  **四张表功能对比**

| 表名     | 主要用途                                   | 常见链                   | 典型使用场景 |
|----------|--------------------------------------------|--------------------------|----------------|
| **filter** | 默认表，控制包是否允许通过（防火墙规则）         | INPUT、FORWARD、OUTPUT   | 防火墙、白名单 |
| **nat**    | 网络地址转换（SNAT/DNAT/MASQUERADE）         | PREROUTING、POSTROUTING、OUTPUT | 容器 NAT、端口映射 |
| **mangle** | 修改包内容（TTL、TOS、标记打 tag 等）        | PREROUTING、POSTROUTING、INPUT、OUTPUT、FORWARD | QoS、带宽管理、多路转发策略 |
| **raw**    | 跳过连接跟踪（NOTRACK）或做额外处理前的 hook | PREROUTING、OUTPUT       | 跳过 conntrack、性能优化 |


### 什么时候用 `mangle` 和 `raw`？

| 场景 | 用哪张表 |
|------|----------|
| 给数据包打 tag / mark，做策略路由 | `mangle` |
| 修改 TTL / TOS 头部 | `mangle` |
| 限速、QoS | `mangle` |
| 某些包不希望被 conntrack 记录（如 DNS） | `raw` |
| 希望在连接跟踪前拦截/识别包 | `raw` |


## 小李的实战锦囊

- 查 NAT 规则：
```sh
sudo  iptables -t nat -L -n -v --line-numbers
```

- 查转发规则：
```sh
sudo  iptables -t filter -L FORWARD -n -v --line-numbers
```

- Ubuntu 22+ 的 nft 模式：
```sh
sudo  iptables-nft -t nat -L -n -v
```
- 每周自动备份一次防火墙配置

```sh
# 写入 root 的 crontab 
0 1 * * 0 /usr/sbin/iptables-save > /home/user/iptables/iptables-backup-$(date +\%F-\%H%M%S).rules
```


## 后记：有些路，看过一遍，就再也不迷路了

iptables 的世界就像一个迷宫，表和链像是检查站，规则像是门卫。请求和响应在这些关口之间穿梭，靠的就是你写的那点“行规”。

技术不是死记硬背，而是看得见的故事、讲得通的逻辑。

好了，今天的请求去哪儿故事讲完，下次再来，咱们讲讲 Docker 网络那点事儿。