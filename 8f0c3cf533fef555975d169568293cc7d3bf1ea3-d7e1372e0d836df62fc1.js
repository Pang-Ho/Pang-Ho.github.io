(self.webpackChunkgatsby_starter_rundevelrun=self.webpackChunkgatsby_starter_rundevelrun||[]).push([[83],{124:function(t,n,r){var e=r(9325);t.exports=function(){return e.Date.now()}},346:function(t){t.exports=function(t){return null!=t&&"object"==typeof t}},659:function(t,n,r){var e=r(1873),o=Object.prototype,i=o.hasOwnProperty,a=o.toString,u=e?e.toStringTag:void 0;t.exports=function(t){var n=i.call(t,u),r=t[u];try{t[u]=void 0;var e=!0}catch(c){}var o=a.call(t);return e&&(n?t[u]=r:delete t[u]),o}},1800:function(t){var n=/\s/;t.exports=function(t){for(var r=t.length;r--&&n.test(t.charAt(r)););return r}},1873:function(t,n,r){var e=r(9325).Symbol;t.exports=e},2552:function(t,n,r){var e=r(1873),o=r(659),i=r(9350),a=e?e.toStringTag:void 0;t.exports=function(t){return null==t?void 0===t?"[object Undefined]":"[object Null]":a&&a in Object(t)?o(t):i(t)}},2912:function(t,n,r){"use strict";var e=r(6540);const o=r(5830).default.h2.withConfig({displayName:"Title__Wrapper",componentId:"sc-13op7xm-0"})(["margin-bottom:24px;font-size:",";font-weight:700;line-height:1.3;color:",";word-break:break-all;& > a{text-decoration:none;color:inherit;transition:all 0.2s;}& > a:hover{color:",";}"],(t=>t.size),(t=>t.theme.colors.text),(t=>t.theme.colors.secondaryText));n.A=t=>{let{size:n,children:r}=t;return e.createElement(o,{size:{sm:"19.2px",md:"25.6px",bg:"26px"}[n]}," ",r," ")}},3173:function(t,n,r){"use strict";var e=r(5556),o=r.n(e);const i=r(5830).default.hr.withConfig({displayName:"Divider",componentId:"sc-1p2wo75-0"})(["margin-top:",";margin-bottom:",";border:none;border-bottom:1px solid ",";"],(t=>t.mt),(t=>t.mb),(t=>t.theme.colors.divider));i.propTypes={mt:o().string,mb:o().string},i.defaultProps={mt:"48px",mb:"48px"},n.A=i},3222:function(t,n,r){var e=r(7556);t.exports=function(t){return null==t?"":e(t)}},3472:function(t,n,r){var e=r(3222);t.exports=function(){var t=arguments,n=e(t[0]);return t.length<3?n:n.replace(t[1],t[2])}},3805:function(t){t.exports=function(t){var n=typeof t;return null!=t&&("object"==n||"function"==n)}},4128:function(t,n,r){var e=r(1800),o=/^\s+/;t.exports=function(t){return t?t.slice(0,e(t)+1).replace(o,""):t}},4394:function(t,n,r){var e=r(2552),o=r(346);t.exports=function(t){return"symbol"==typeof t||o(t)&&"[object Symbol]"==e(t)}},4840:function(t,n,r){var e="object"==typeof r.g&&r.g&&r.g.Object===Object&&r.g;t.exports=e},4932:function(t){t.exports=function(t,n){for(var r=-1,e=null==t?0:t.length,o=Array(e);++r<e;)o[r]=n(t[r],r,t);return o}},5195:function(t,n,r){"use strict";var e=r(6540),o=r(7601);n.A=()=>{const{adsense:t}=o.A;return(0,e.useEffect)((()=>{let t=setInterval((()=>{window.adsbygoogle&&((()=>{try{window.adsbygoogle.push({})}catch(t){console.error(t)}})(),clearInterval(t))}),300);return()=>{clearInterval(t)}}),[]),e.createElement(e.Fragment,null,t&&e.createElement("ins",{className:"adsbygoogle",style:{display:"block"},"data-ad-client":t.client,"data-ad-slot":t.slot,"data-ad-format":"auto","data-full-width-responsive":"true"}))}},6449:function(t){var n=Array.isArray;t.exports=n},7350:function(t,n,r){var e=r(8221),o=r(3805);t.exports=function(t,n,r){var i=!0,a=!0;if("function"!=typeof t)throw new TypeError("Expected a function");return o(r)&&(i="leading"in r?!!r.leading:i,a="trailing"in r?!!r.trailing:a),e(t,n,{leading:i,maxWait:n,trailing:a})}},7556:function(t,n,r){var e=r(1873),o=r(4932),i=r(6449),a=r(4394),u=e?e.prototype:void 0,c=u?u.toString:void 0;t.exports=function t(n){if("string"==typeof n)return n;if(i(n))return o(n,t)+"";if(a(n))return c?c.call(n):"";var r=n+"";return"0"==r&&1/n==-1/0?"-0":r}},8221:function(t,n,r){var e=r(3805),o=r(124),i=r(9374),a=Math.max,u=Math.min;t.exports=function(t,n,r){var c,f,l,s,p,v,d=0,g=!1,m=!1,b=!0;if("function"!=typeof t)throw new TypeError("Expected a function");function x(n){var r=c,e=f;return c=f=void 0,d=n,s=t.apply(e,r)}function y(t){var r=t-v;return void 0===v||r>=n||r<0||m&&t-d>=l}function h(){var t=o();if(y(t))return w(t);p=setTimeout(h,function(t){var r=n-(t-v);return m?u(r,l-(t-d)):r}(t))}function w(t){return p=void 0,b&&c?x(t):(c=f=void 0,s)}function j(){var t=o(),r=y(t);if(c=arguments,f=this,v=t,r){if(void 0===p)return function(t){return d=t,p=setTimeout(h,n),g?x(t):s}(v);if(m)return clearTimeout(p),p=setTimeout(h,n),x(v)}return void 0===p&&(p=setTimeout(h,n)),s}return n=i(n)||0,e(r)&&(g=!!r.leading,l=(m="maxWait"in r)?a(i(r.maxWait)||0,n):l,b="trailing"in r?!!r.trailing:b),j.cancel=function(){void 0!==p&&clearTimeout(p),d=0,c=v=f=p=void 0},j.flush=function(){return void 0===p?s:w(o())},j}},9325:function(t,n,r){var e=r(4840),o="object"==typeof self&&self&&self.Object===Object&&self,i=e||o||Function("return this")();t.exports=i},9350:function(t){var n=Object.prototype.toString;t.exports=function(t){return n.call(t)}},9374:function(t,n,r){var e=r(4128),o=r(3805),i=r(4394),a=/^[-+]0x[0-9a-f]+$/i,u=/^0b[01]+$/i,c=/^0o[0-7]+$/i,f=parseInt;t.exports=function(t){if("number"==typeof t)return t;if(i(t))return NaN;if(o(t)){var n="function"==typeof t.valueOf?t.valueOf():t;t=o(n)?n+"":n}if("string"!=typeof t)return 0===t?t:+t;t=e(t);var r=u.test(t);return r||c.test(t)?f(t.slice(2),r?2:8):a.test(t)?NaN:+t}}}]);
//# sourceMappingURL=8f0c3cf533fef555975d169568293cc7d3bf1ea3-d7e1372e0d836df62fc1.js.map