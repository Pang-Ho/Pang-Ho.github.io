"use strict";(self.webpackChunkgatsby_starter_rundevelrun=self.webpackChunkgatsby_starter_rundevelrun||[]).push([[765],{874:function(e,t,a){a.r(t);var r=a(6540),n=a(5830),l=a(5482),o=a(8681),s=a(5608),c=a(70),i=a(6576),d=a(698),u=a(7601),p=a(3173);const m=n.default.div.withConfig({displayName:"search__SearchWrapper",componentId:"sc-z3cz1s-0"})(["margin-top:20px;@media (max-width:768px){padding:0 15px;}"]);t.default=e=>{let{data:t}=e;const{title:a,description:n,siteUrl:h}=u.A,w=t.allMarkdownRemark.nodes,{0:g,1:f}=(0,r.useState)(""),C=(0,r.useCallback)(w.filter((e=>{const{frontmatter:t,rawMarkdownBody:a}=e,{title:r}=t,n=g.toLocaleLowerCase();return!!a.toLocaleLowerCase().includes(n)||r.toLocaleLowerCase().includes(n)})),[g]);return r.createElement(o.A,null,r.createElement(l.A,{title:a,description:n,url:h}),r.createElement(d.A,{size:10}),r.createElement(m,null,r.createElement(i.A,{badgeContent:C.length,color:"warning",max:99,showZero:!0,sx:{top:"5px",left:"2px"}}),r.createElement(c.A,{onChange:e=>f(e.target.value),placeholder:"Search"})),r.createElement(p.A,null),r.createElement(s.A,{postList:C}))}}}]);
//# sourceMappingURL=component---src-pages-search-jsx-f4ffed7c8743a51d2a56.js.map