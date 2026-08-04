(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[653],{5865:function(e,t,r){Promise.resolve().then(r.bind(r,6648))},6648:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var s=r(7437),n=r(4033),a=r(1396),i=r.n(a),o=r(3731);function c(){let{id:e}=(0,n.useParams)();return(0,s.jsxs)("div",{children:[(0,s.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-500 mb-4",children:[(0,s.jsx)(i(),{href:"/dashboard/cooperatives",className:"hover:text-emerald-600",children:"Coop\xe9ratives"}),(0,s.jsx)("span",{children:"/"}),(0,s.jsx)(i(),{href:"/dashboard/cooperatives/".concat(e),className:"hover:text-emerald-600",children:"D\xe9tail"}),(0,s.jsx)("span",{children:"/"}),(0,s.jsx)("span",{className:"text-gray-800 font-medium",children:"Soci\xe9t\xe9s"})]}),(0,s.jsxs)("div",{className:"bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center",children:[(0,s.jsx)(o.Z,{size:48,className:"mx-auto mb-4 text-gray-300"}),(0,s.jsx)("h2",{className:"text-lg font-semibold text-gray-700 mb-2",children:"Soci\xe9t\xe9s membres"}),(0,s.jsx)("p",{className:"text-sm text-gray-500",children:"La liste des soci\xe9t\xe9s de cette coop\xe9rative sera affich\xe9e ici."})]})]})}},622:function(e,t,r){"use strict";var s=r(2265),n=Symbol.for("react.element"),a=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,o=s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function l(e,t,r){var s,a={},l=null,u=null;for(s in void 0!==r&&(l=""+r),void 0!==t.key&&(l=""+t.key),void 0!==t.ref&&(u=t.ref),t)i.call(t,s)&&!c.hasOwnProperty(s)&&(a[s]=t[s]);if(e&&e.defaultProps)for(s in t=e.defaultProps)void 0===a[s]&&(a[s]=t[s]);return{$$typeof:n,type:e,key:l,ref:u,props:a,_owner:o.current}}t.Fragment=a,t.jsx=l,t.jsxs=l},7437:function(e,t,r){"use strict";e.exports=r(622)},1396:function(e,t,r){e.exports=r(5250)},4033:function(e,t,r){e.exports=r(5313)},8792:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return l}});var s=r(2265),n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1};var i=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,s.createContext)({}),c=()=>(0,s.useContext)(o),l=(0,s.forwardRef)(({color:e,size:t,strokeWidth:r,absoluteStrokeWidth:o,className:l="",children:u,iconNode:d,...f},h)=>{let{size:m=24,strokeWidth:p=2,absoluteStrokeWidth:x=!1,color:v="currentColor",className:y=""}=c()??{},_=o??x?24*Number(r??p)/Number(t??m):r??p;return(0,s.createElement)("svg",{ref:h,...n,width:t??m??n.width,height:t??m??n.height,stroke:e??v,strokeWidth:_,className:(0,i.z)("lucide",y,l),...!u&&!a(f)&&{"aria-hidden":"true"},...f},[...d.map(([e,t])=>(0,s.createElement)(e,t)),...Array.isArray(u)?u:[u]])})},5582:function(e,t,r){"use strict";r.d(t,{Z:function(){return l}});var s=r(2265),n=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase()),o=e=>{let t=i(e);return t.charAt(0).toUpperCase()+t.slice(1)};var c=r(8792);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let l=(e,t)=>{let r=(0,s.forwardRef)(({className:r,...i},l)=>(0,s.createElement)(c.default,{ref:l,iconNode:t,className:(0,n.z)(`lucide-${a(o(e))}`,`lucide-${e}`,r),...i}));return r.displayName=o(e),r}},3731:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});let s=(0,r(5582).Z)("briefcase",[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]])},2963:function(e,t,r){"use strict";r.d(t,{z:function(){return s}});/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim()}},function(e){e.O(0,[5250,2971,4938,1744],function(){return e(e.s=5865)}),_N_E=e.O()}]);