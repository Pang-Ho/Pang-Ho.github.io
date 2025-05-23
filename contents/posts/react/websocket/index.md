---  
emoji: '💬'  
title: 'WebSocket에 대해 알아보자'  
date: 2025-05-20 00:00:00  
update: 2025-05-20 00:00:00  
tags:  
  - react  
  - springboot  
  - websocket  
series: 'WebSocket'  
---  
  
## 배경<br>  
유튜브를 보다가 좋아요 수가 계속 올라가는 걸 보았다. 문득 API로만 웹 개발을 해온 나로서, 이거 어떻게 구현된거지? 어떻게 된거지? 생각이 들었다. 주기적으로 API를 요청하는 것이라 생각하고 gpt에게 구현 방법을 물어봤다.  
WebSocket? 채팅에서 사용하는 그 무언가… 라고 알고있었는데, 이걸 좋아요에서 사용한다?  
흥미롭다  
  
## WebSocket이란 무엇인가<br>  
우리가 사용하는 API 이건 요청을 하면 응답을 하고 끝난다. 그렇지만 WebSocket은 연결이 계속 유지되면서 데이터가 이동한다.  
API는 뭘 했길래 요청 응답만 하고, WebSocket은 계속 연결이 유지될까?  
API는 HTTP 라는 프로토콜을 사용한다. WebSocket은 프로토콜이다.  
* HTTP  
* WebSocket  
  
## 연결이 유지되는 과정<br>  
1. HTTP 요청처럼 서버에 GET 요청으로 웹소켓 연결(handshake)을 요청한다. 여기서 중요한건 헤더에 넣어지는 내용이다.  
   1. Upgrade: websocket  
   1. Connection: Upgrade  
1. 서버에서 websocket 프로토콜로 Upgrade 한다는 요청(handshake)을 승인한다.  
   1. 101 Switching Protocols  
1. `ws://` 로 시작되는 데이터를 주고받는다.  
  
## WebSocket과 함께 사용하는 STOMP<br>  
WebSocket을 얘기하면 STOMP가 같이 따라온다. STOMP는 무엇인지 왜 같이 사용하는지 말해보고자 한다.  
  
### STOMP(Simple Text Oriented Messaging Protocol)<br>  
WebSocket은 양방향 연결만 해주고, 바이트 스트림 형태로만 데이터를 전달할 수 있다. 나는 어떤 채널에서 다양한 데이터를 주고받고 싶은데 WebSocket만으로는 문자열만 보낼 수 있다.  
그래서 WebSocket 위에서 동작하는 메시징 프로토콜로 HTTP처럼 메시지 양식을 만들어 데이터를 보낸다.   
  
```plain text  
SEND
destination:/queue/messages
content-type:aaplication/json

{
	"id": "1",
	"message": "Hello"
}  
```  
  
위 메시지에서 상단에 쓰는 내용은 명령어다. 명령어로는 CONNECT, SEND, SUBSCRIBE 같이 메시지 발행, 트랜잭션 관리, 에러 처리 등 여러 역할을 부여할 수 있다.  
  
## WebSocket을 쓰면 성능 이슈가 생길거 같은데<br>  
연결을 계속 하는건데 유튜브처럼 몇 억 명이 쓰는 상황을 대처하는걸까?  
수많은 사람들을 대응해야 한다면 당연히 서버는 여러 인스턴스를 만들어 로드밸런싱을 이용할 것이다.   
이러면 서버의 WebSocket이 여러개가 되는데, 클라이언트끼리 서로 다른 WebSocket에 연결되어있는 경우 당연히 데이터가 전달이 안된다. 그러면 어떻게 유지할건지를 생각해야한다.  
  
### Redis<br>  
어디선가 들어본 인메모리 데이터베이스, 이를 사용한다. Redis는 인메모리 DB지만, 처리속도가 매우 빠르고 수만 TPS를 감당할 수 있기 때문에 단일 인스턴스로 구성하여 사용한다.  
나는 메시지 이동용으로 사용할것이기 때문에 데이터를 저장하고 조회하는 일반 Redis가 아닌 데이터를 전달만하는 Redis Pub/Sub를 이용해 메시지 브로커 기능을 이용할 것이다.  
내 상황에선 여러 SpringBoot로 이루어진 WAS 서버가 있고, 각 WAS 서버의 Redis 클라이언트가 다른 `Redis 서버` 와 연결하여 사용할 것이다.  
```plain text  
[ Client A ] ────> [ WAS 서버 1 ] ────┐
                                      │
[ Client B ] ────> [ WAS 서버 2 ] ──┐  │
                                    ▼  ▼
                                [ Redis 서버 ]   <── (중앙 메시지 허브)
                                     ▲  ▲
[ Client C ] <──── [ WAS 서버 3 ] ◀──┘  └── [ WAS 서버 1 ]  
```  
  
## WebSocket으로 할 것<br>  
내 최종 목표는 알림기능이다. 채팅 기능을 만들어보고, 채팅이 오면 알림 기능도 만들어보고, 관리자 화면에서 대상 사용자에게 알림도 만들어보고 좋아요 기능도 만들어보자  
