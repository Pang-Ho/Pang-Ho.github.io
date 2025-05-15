---  
emoji: '🚀'  
title: 'Nogi를 이용하여 노션에 작성한 글을 깃허브에 자동으로 올려보자'  
date: 2025-05-15 00:00:00  
update: 2025-05-15 00:00:00  
tags:  
  - Nogi  
series: 'Nogi'  
---  
  
## Nogi란 무엇인가?<br>  
깃허브와 노션을 연견해주고, Nogi에서 설정한 Notion 템플릿에 내용을 작성하면, 내가 지정한 깃허브 레포지토리에 마크다운 파일을 만들어준다.  
  
![IMAGE](https://raw.githubusercontent.com/nogi-bot/resources/main/Pang-Ho/images/90458393-3771-49dd-8a7c-8c95c3c1cb44-image.png)  
이곳에 글을 작성중이다. 템플릿에 내용을 채우고 nogiStatus를 작성 완료로 변경하면 Nogi bot이 이 내용을 들고 연결된 내 Repository에 커밋을 해준다.  
  
## 사용 방법<br>  
1. Nogi 로그인  
   1. [https://nogi.co.kr/](https://nogi.co.kr/) 접속  
   1. Github, Notion 아이디와 연결  
   1. Notion에 “**개발자가 제공한 템플릿 사용**” 생성  
1. Nogi Setting을 들어가서 Repository 연결을한다.  
1. Notion을 들어가서 아무거나 nogiStatus를 작성완료로 바꾸고, Nogi Setting을 들어가 수동실행을 눌러준다.  
1. Github 연결된 Repository에 들어가 issue를 확인한다.  
  
## 사용 이유<br>  
현재 내 블로그는 Gatsby라는 프레임워크로 만들어져있다. 그곳에 마크다운으로 작성되어 있는데, 블로그에 글을 작성하려면 vs code도 열어야하고, 사이트에서 잘 보이는지 서버도 켜야하고 불편하다. 그래서 노션에 글을 쓰고, 깃허브에 올려주고 나중에 포스팅이 필요하면 Deploy하면 좋지 않을까 싶어서 사용한다.  
  
## 개선할 점<br>  
1. Repository branch 설정이 없다.  
1. issue 오류에 정확한 문제 내용이 안뜬다  
  
## 작동 원리<br>  
1. 10분마다 Notion에 작성완료 되어있는 페이지를 조회하고 Markdown으로 파일을 변환한다.  
1. Markdown 파일을 깃허브에 커밋한다.  
   1. 신규 Repository인 경우, Repository 생성, Collaborators에 nogi-bot을 추가  
1. Notion에서 nogiStatus를 변경해준다. 성공시 완료, 실패시 실패  
1. Github issue에 성공 여부 알림을 넣어준다.  
  
이 작동을 하려면 전제조건이, Repository가 public이고, Collaborators에 nogi-bot이 추가되어 있어야 한다.   
또한, 내 깃허브에서만 버그나는 건진 모르겠지만, master branch가 있어야한다.  
신규 Repository인 경우(Nogi에서 없는 브랜치 이름을 세팅하는 경우), 마크다운을 올리면 Nogi가 알아서 신규 Repository를 만들어주고 세팅을 해준다. 여기서 세팅이라 하면, Default Branch를 master로 설정하고, Collaborators에 Nogi bot을 설정해주는 것이다.  
  
## Github에 Commit 중 문제가 발생했어요.<br>  
기존 브랜치에 Nogi를 사용하려 하는데, 이 오류를 보는 경우, 시행해야 할 방법이 하나 있다.  
1. 신규 Repository에서 Nogi를 실행한다.(Nogi setting에서 없는 Repository를 설정 후, Nogi Template에서 작성완료 설정)  
1. 만들어진 신규 Repository에서 세팅된 브랜치 명과 Collaborators에 누가 들어가 있는지 확인한다.  
1. 기존 Repository에 해당 브랜치명을 만들고, Collaborators에 nogi-bot을 추가한다.  
  
위 방법은 글쓴이가 겪고 시행한 방법이다 ㅜㅜ… 저렇게 설정하니까 이제 돼서 화가 많이 나서 소스를 확인했다.  
  
위 Repository는 nogi 소스 Repository다. 코드를 구경해보면 너무 화가난다. 코드 스타일이 너무 깔끔하다. 백엔드 소스가 정말 잘 만들어져 있으니, 한번 보면 좋을 것 같다.   
  
<details><summary>그럼 글쓴이는 Default Branch를 보게 되어 있으나, 왜 master 브랜치에만 올리는지 소스를 보면서 파악해볼 것이다. (다른 사람 소스 읽는게 너무 즐거워~)</summary>  
  
  </details>  
