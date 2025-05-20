---  
emoji: '💬'  
title: 'WebSocket으로 채팅 기능 만들어보자'  
date: 2025-05-22 00:00:00  
update: 2025-05-22 00:00:00  
tags:  
  - react  
  - springboot  
  - websocket  
series: 'WebSocket'  
---  
# WebSocket으로 채팅방 만들기<br>  
  
## 🧪 테스트 환경 <br>  
> React v18  
>  
> SpringBoot v3.1.5  
  
리액트에서 받아야 할 라이브러리  
stompjs가 아닌 타입스크립트를 지원하고 최신 설계 방식을 지원하는 @stomp/stompjs 를 이용합니다.  
```shell  
$ yarn add sockjs-client @stomp/stompjs
$ yarn add @types/stompjs @types/sockjs-client --dev  
```  
  
백엔드에서 받아야할 라이브러리  
```groovy  
implementation 'org.springframework.boot:spring-boot-starter-websocket'	// webSocket  
```  
  
## 배경<br>  
이전에 유튜브 좋아요가 계속 올라가는 걸 보면서 어떻게 구현됐는지 찾아보다가 WebSocket에 관심이 생겼다. 이를 이용해 만드는 가장 간단한 기능이 채팅방이기에 Nextjs와 WebSocket을 공부할겸 구현해보았다.   
  
## 목표<br>  
스프링부트에서 WebSocket 기본 설정과 STOMP에 대한 Subscribe, Publish 설정 개념을 알아보고자 한다.  
리액트에서 WebSocket Client의 개념과 STOMP 선언하고 연결하는 방식을 알아보고자 한다.  
  
## 구현 과정<br>  
서버와 클라이언트에서 어떻게 WebSocket을 연결하고 Subscribe와 Publish에 대해 알아보고자 한다.  
  
Subscribe :   
* 클라이언트가 특정 서버 경로를 지속적으로 관찰하는 동작을 구독이라고 한다.   
* 클라이언트가 해당 경로를 구독하고, 해당 경로로 서버가 클라이언트로 메시지를 전달하면 구독하고 있는 클라이언트가 메시지를 수신한다.  
* 예시 경로 : /topic/chat/{roomId}, /user/queue/private  
Publish :   
* 클라이언트가 서버로 메시지를 전송하는 동작을 발행이라고 한다.  
* 클라이언트가 특정 경로로 메시지를 발행하며, 서버는 이를 메시지 브로커로서 전달하고 처리한다.  
* 예시 경로 : /app/chat.send.{roomId}, /app/private-message  
  
서버에서 할 일  
1. 서버에서 WebSocket 경로를 설정한다.  
1. STOMP에서 Subscribe용 prefix와 Publish용 prefix를 설정한다.  
1. 클라이언트에서 메시지 Publish용 로직 처리 컨트롤러를 만든다.  
  
프론트에서 할 일  
1. WebSocket 경로를 설정한다.  
1. WebSocket 연결시 행동, 구독 경로로 메시지를 받는 경우 행동을 구현한다.  
1. 메시지를 발행하는 로직을 구현한다.  
  
## 구현<br>  
브로드캐스트 메시지를 대상으로만 간단하게 구현해볼 것이다.   
1:1 메시지 관련 구현은 프론트는 비슷하나 서버쪽이 조금 다르므로 추가 내용에 넣어보겠다  
### 서버에서 할 일<br>  
1. 서버에서 WebSocket 경로를 설정한다.  
1. STOMP에서 Subscribe용 prefix와 Publish용 prefix를 설정한다.  
```java  
@Configuration
@EnableWebSocketMessageBrocker  // WebSocket STOMP 기반 메시징 서버 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 웹소켓 연결
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")         // 클라이언트가 사용할 웹소켓 엔드포인트
                .setAllowedOriginPatterns("*")    // cors
                .withSockJS();  // SockJS 활성화 (웹 소켓을 지원하지 않는 경우)
    }

    /**
     * 메시지 브로커 설정 (클라이언트 입장에서 구독/발행이란 뜻)
     * STOMP endpoint 설정 커스터마이징
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
		    // Subscribe 구독용 prefix (서버 -> 클라이언트)
		    // topic은 브로드캐스트 메시지용 prefix
		    // queue는 1:1 메시지용 prefix
        registry.enableSimpleBroker("/topic", "/queue"); 
        
        // Publish 발행용 prefix (클라이언트 -> 서버)
        registry.setApplicationDestinationPrefixes("/app"); 
    }
}
  
```  
1. 클라이언트에서 메시지 Publish용 로직 처리 컨트롤러를 만든다.  
   1. 메시지 발행 방법은 두 가지가 있다.  위에서 설정한 브로드캐스트 메시지, 1:1 메시지  
   1. `/topic` 으로 설정한 메시지 발행은 브로드캐스트 메시지로 광역으로 나간다.  
   1. `/queue` 으로 설정한 메시지 발행은 세션 기반으로 발행이 된다.  
```java  
@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    @MessageMapping("/chat.send.{roomId}")  // 메시지 보낼 URL 경로, 실제론 /app/chat.send.{roomId}
    @SendTo("/topic/chatroom/{roomId}")     // 구독 경로 해당 URL로 메시지를 받을 수 있음
    public ChatMessage send(@DestinationVariable Long roomId, ChatMessage message) {
        message.setRoomId(roomId);
        message.setSentAt(LocalDateTime.now());

        return message; // 브로드캐스트 메시지 전송
    }
}  
```  
  
1:1 메시지 구독 및 발행 추가 내용  
세션을 이용해 수신자에게 메시지를 전달한다. 그래서 JWT만 사용하는 경우 따로 HandShakeInterceptor를 구현하여 beforeHandshake, afterHandshake를 구현하여 JWT 토큰을 검증해야한다.  
```javascript  
@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    @MessageMapping("/private-message")
		public void sendPrivateMessage(PrivateMessage message) {
				// 1:1 메시지 전달
		    messagingTemplate.convertAndSendToUser(
		        message.getRecipient(), // 수신자 ID
		        "/queue/private",       // 목적지 (Spring이 자동으로 /user 추가)
		        message                 // 전송할 메시지
		    );
		}
}  
```  
  
### 프론트에서 할 일<br>  
1. WebSocket 경로를 설정한다.  
1. WebSocket 연결시 행동, 구독 경로로 메시지를 받는 경우 행동을 구현한다.  
1. 메시지를 발행하는 로직을 구현한다.  
  
메시지 구독시 행동과 메시지 발행하는 로직을 가지고있는 CustomHook  
```javascript  
interface UseWebSocketClientProps {
  onMessage: (message: any) => void;
  subscribeUrl: string;
  publishUrl: string;
}

export const useWebSocketClient = ({
	onMessage,
	publishUrl,
	subscribeUrl,
}: UseWebSocketClientProps) => {
	const clientRef = useRef<Client | null>(null);
	
	useEffect(() => {
		const client = new Client({
			webSocketFactory: () =>
				new SockJS('http://localhost:8080/ws'), // 웹소켓 첫 연결 경로
				
			onConnect: () => { // 연결이 된 경우 구독부터 하여 메시지 받을 준비를 한다.
				// 구독 경로와 구독의 콜백함수 설정하여 메시지가 온 경우 할 행동
				client.subscribe(subscribeUrl, (message) => {
					const received = JSON.parse(message.body);
					onMessage(received); // 메시지가 오면 처리하는 로직
				});
			},
		});
		
		client.activate();
		clentRef.current = clent;
		
		return () => {
			client.deactivate();
		}
	}, [onMessage, publishUrl, subscribeUrl]);
	
	const sendMessage = (message: ChatMessage) => {
	if (clentRef.current && clentRef.current.connected) {
		clentRef.current.publish({
			destination: publishUrl,
			body: JSON.stringify(message),
		});
	} else {
		console.error('WebSocket is not connected');
	}
	
	return { sendMessage };
}  
```  
  
메시지 목록과 전송 인풋  
```javascript  
export const ChatView = ({ roomId, chatRoomData }: ChatViewProps) => {

	// 구독된 경로로 메시지가 온 경우
	cont handleMessage = (message: ChatMessage) => {
		setMessage((prev) => [...prev, message]);
	}
	
	const { sendMessage } = useWebSocketClient({
		onMessage: handleMessage,
		publishUrl: `/app/chat.sent.${roomId}`,
		subscribeUrl: `/topic/chatroom/${roomId}`
	});
	
	const [message, setMessage] = useState<ChatMessage[]>([]);
	
	const handleSendMessage = (messag: string) => {
		if (message.trim() === '') return;
		
		const chatMessage: ChatMessage = {
			roomId,
			sender: {유저 아이디},
			message: message,
		}
		
		sendMessage(chatMessage);
	}
	
	return (
		<>
			<div style={{ >
				{message.map((msg) => (
					<div
					  key={msg.id}
					  style={{
                display: 'flex',
                justifyContent:
                  msg.sender === {유저아이디} ? 'flex-end' : 'justify-start',
            }}
					>
						<div>
							{msg.message}
						</div>
					</div>
				))}
			</div>
			<div>
				<ChatInput onSendMessage={handleSendMessage} />
			</div>
		</>
	)
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
	const [text, setText] = useState<string>('');

  const handleSendMessage = () => {
    onSendMessage(text);
    setText('');
  };
  
  return (
    <div style={{ display: 'flex' }}>
      <input
        type="text"
        placeholder="메시지 입력"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
      />
      <button
        onClick={handleSendMessage}
      >
        전송
      </button>
    </div>
  );
}  
```  
  
## 결론<br>  
WebSocket의 개념 STOMP 프로토콜과 함께 subscribe와 publish 개념을 이해하게 되는 구현이었다.  
지금은 간단하게 채팅을 구현해봤기 때문에 채팅방에 참여했을 때만 메시지 내용을 알 수 있다. 이후 채팅방에서 이전 대화 목록을 가져오는 내용까지 구현하고, 1:1 메시지 발행을 이용해 알림 기능까지 만들 계획이다.  
  
