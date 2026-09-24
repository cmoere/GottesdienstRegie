import '@testing-library/jest-dom/vitest';

Object.defineProperty(window,'matchMedia',{
  configurable:true,
  value:()=>({
    matches:false,
    media:'',
    onchange:null,
    addListener(){},
    removeListener(){},
    addEventListener(){},
    removeEventListener(){},
    dispatchEvent(){return false}
  })
});
