(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7463],{3232:function(e,t,r){Promise.resolve().then(r.bind(r,3942))},3942:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return l}});var n=r(7437),s=r(4033),a=r(1396),i=r.n(a),o=r(2520);function l(){let{id:e}=(0,s.useParams)();return(0,n.jsxs)("div",{children:[(0,n.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-500 mb-4",children:[(0,n.jsx)(i(),{href:"/dashboard/flottes",className:"hover:text-blue-600",children:"Flottes"}),(0,n.jsx)("span",{children:"/"}),(0,n.jsx)(i(),{href:"/dashboard/flottes/".concat(e),className:"hover:text-blue-600",children:"D\xe9tail"}),(0,n.jsx)("span",{children:"/"}),(0,n.jsx)("span",{className:"text-gray-800 font-medium",children:"Entretien"})]}),(0,n.jsxs)("div",{className:"bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center",children:[(0,n.jsx)(o.Z,{size:48,className:"mx-auto mb-4 text-gray-300"}),(0,n.jsx)("h2",{className:"text-lg font-semibold text-gray-700 mb-2",children:"Entretien"}),(0,n.jsx)("p",{className:"text-sm text-gray-500",children:"Le suivi d'entretien des v\xe9hicules sera affich\xe9 ici."}),(0,n.jsx)("p",{className:"text-xs text-gray-400 mt-2",children:"Fonctionnalit\xe9 \xe0 impl\xe9menter."})]})]})}},622:function(e,t,r){"use strict";var n=r(2265),s=Symbol.for("react.element"),a=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,o=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function c(e,t,r){var n,a={},c=null,u=null;for(n in void 0!==r&&(c=""+r),void 0!==t.key&&(c=""+t.key),void 0!==t.ref&&(u=t.ref),t)i.call(t,n)&&!l.hasOwnProperty(n)&&(a[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps)void 0===a[n]&&(a[n]=t[n]);return{$$typeof:s,type:e,key:c,ref:u,props:a,_owner:o.current}}t.Fragment=a,t.jsx=c,t.jsxs=c},7437:function(e,t,r){"use strict";e.exports=r(622)},1396:function(e,t,r){e.exports=r(5250)},4033:function(e,t,r){e.exports=r(5313)},8792:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var n=r(2265),s={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1};var i=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,n.createContext)({}),l=()=>(0,n.useContext)(o),c=(0,n.forwardRef)(({color:e,size:t,strokeWidth:r,absoluteStrokeWidth:o,className:c="",children:u,iconNode:d,...f},h)=>{let{size:m=24,strokeWidth:x=2,absoluteStrokeWidth:p=!1,color:w="currentColor",className:_=""}=l()??{},v=o??p?24*Number(r??x)/Number(t??m):r??x;return(0,n.createElement)("svg",{ref:h,...s,width:t??m??s.width,height:t??m??s.height,stroke:e??w,strokeWidth:v,className:(0,i.z)("lucide",_,c),...!u&&!a(f)&&{"aria-hidden":"true"},...f},[...d.map(([e,t])=>(0,n.createElement)(e,t)),...Array.isArray(u)?u:[u]])})},5582:function(e,t,r){"use strict";r.d(t,{Z:function(){return c}});var n=r(2265),s=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase()),o=e=>{let t=i(e);return t.charAt(0).toUpperCase()+t.slice(1)};var l=r(8792);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let c=(e,t)=>{let r=(0,n.forwardRef)(({className:r,...i},c)=>(0,n.createElement)(l.default,{ref:c,iconNode:t,className:(0,s.z)(`lucide-${a(o(e))}`,`lucide-${e}`,r),...i}));return r.displayName=o(e),r}},2520:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(5582).Z)("wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]])},2963:function(e,t,r){"use strict";r.d(t,{z:function(){return n}});/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim()}},function(e){e.O(0,[5250,2971,4938,1744],function(){return e(e.s=3232)}),_N_E=e.O()}]);