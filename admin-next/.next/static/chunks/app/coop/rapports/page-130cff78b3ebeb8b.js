(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1539],{6215:function(e,t,r){Promise.resolve().then(r.bind(r,1347))},1347:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return o}});var s=r(7437),n=r(8492);function o(){return(0,s.jsxs)("div",{children:[(0,s.jsx)("h1",{className:"text-2xl font-bold text-gray-800 mb-6",children:"\uD83D\uDCCA Rapports"}),(0,s.jsx)("div",{className:"grid grid-cols-3 gap-4 mb-6",children:[{icon:"\uD83C\uDFCD️",title:"Export V\xe9hicules",desc:"Liste compl\xe8te des v\xe9hicules"},{icon:"\uD83D\uDC65",title:"Export Chauffeurs",desc:"Liste compl\xe8te des chauffeurs"},{icon:"\uD83D\uDCB0",title:"Export Finances",desc:"Courses, CA, commissions"}].map(e=>(0,s.jsxs)("div",{className:"bg-white rounded-xl p-6 shadow-sm border text-center hover:shadow-md transition cursor-pointer",children:[(0,s.jsx)("div",{className:"text-4xl mb-3",children:e.icon}),(0,s.jsx)("h3",{className:"font-bold text-gray-800",children:e.title}),(0,s.jsx)("p",{className:"text-sm text-gray-500 mt-1",children:e.desc}),(0,s.jsxs)("button",{className:"mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto hover:bg-emerald-700",children:[(0,s.jsx)(n.Z,{size:14})," Exporter"]})]},e.title))})]})}},622:function(e,t,r){"use strict";var s=r(2265),n=Symbol.for("react.element"),o=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,a=s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function c(e,t,r){var s,o={},c=null,u=null;for(s in void 0!==r&&(c=""+r),void 0!==t.key&&(c=""+t.key),void 0!==t.ref&&(u=t.ref),t)i.call(t,s)&&!l.hasOwnProperty(s)&&(o[s]=t[s]);if(e&&e.defaultProps)for(s in t=e.defaultProps)void 0===o[s]&&(o[s]=t[s]);return{$$typeof:n,type:e,key:c,ref:u,props:o,_owner:a.current}}t.Fragment=o,t.jsx=c,t.jsxs=c},7437:function(e,t,r){"use strict";e.exports=r(622)},8792:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var s=r(2265),n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1};var i=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s.createContext)({}),l=()=>(0,s.useContext)(a),c=(0,s.forwardRef)(({color:e,size:t,strokeWidth:r,absoluteStrokeWidth:a,className:c="",children:u,iconNode:d,...f},h)=>{let{size:m=24,strokeWidth:p=2,absoluteStrokeWidth:x=!1,color:v="currentColor",className:w=""}=l()??{},_=a??x?24*Number(r??p)/Number(t??m):r??p;return(0,s.createElement)("svg",{ref:h,...n,width:t??m??n.width,height:t??m??n.height,stroke:e??v,strokeWidth:_,className:(0,i.z)("lucide",w,c),...!u&&!o(f)&&{"aria-hidden":"true"},...f},[...d.map(([e,t])=>(0,s.createElement)(e,t)),...Array.isArray(u)?u:[u]])})},5582:function(e,t,r){"use strict";r.d(t,{Z:function(){return c}});var s=r(2265),n=r(2963);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase()),a=e=>{let t=i(e);return t.charAt(0).toUpperCase()+t.slice(1)};var l=r(8792);/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let c=(e,t)=>{let r=(0,s.forwardRef)(({className:r,...i},c)=>(0,s.createElement)(l.default,{ref:c,iconNode:t,className:(0,n.z)(`lucide-${o(a(e))}`,`lucide-${e}`,r),...i}));return r.displayName=a(e),r}},8492:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});let s=(0,r(5582).Z)("download",[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]])},2963:function(e,t,r){"use strict";r.d(t,{z:function(){return s}});/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim()}},function(e){e.O(0,[2971,4938,1744],function(){return e(e.s=6215)}),_N_E=e.O()}]);