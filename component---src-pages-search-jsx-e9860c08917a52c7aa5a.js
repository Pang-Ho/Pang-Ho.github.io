"use strict";(self.webpackChunkthe_great_pang=self.webpackChunkthe_great_pang||[]).push([[765],{874:function(e,t,a){a.r(t);var l=a(6540),n=a(8094),r=a(6773),o=a(3832),c=a(5608),s=a(8961),i=a(638),p=a(698),d=a(7601),u=a(3173);const m=n.default.div.withConfig({displayName:"search__SearchWrapper",componentId:"sc-o9tf20-0"})(["margin-top:20px;@media (max-width:768px){padding:0 13px;}"]);t.default=e=>{let{data:t}=e;const{title:a,description:n,siteUrl:h}=d.A,f=t.allMarkdownRemark.nodes,{0:g,1:w}=(0,l.useState)(""),C=(0,l.useCallback)(f.filter((e=>{const{frontmatter:t,rawMarkdownBody:a}=e,{title:l}=t,n=g.toLocaleLowerCase();return!!a.toLocaleLowerCase().includes(n)||l.toLocaleLowerCase().includes(n)})),[g]);return l.createElement(o.A,null,l.createElement(r.A,{title:a,description:n,url:h}),l.createElement(p.A,{size:10}),l.createElement(m,null,l.createElement(i.A,{badgeContent:C.length,color:"info",max:99,showZero:!0,sx:{top:"12px",left:"2px"}}),l.createElement(s.A,{onChange:e=>w(e.target.value),placeholder:"Search"})),l.createElement(u.A,null),l.createElement(c.A,{postList:C}))}}}]);
//# sourceMappingURL=component---src-pages-search-jsx-e9860c08917a52c7aa5a.js.map