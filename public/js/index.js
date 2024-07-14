
const navBg = document.getElementById('navBg');
const navBtnBox = document.querySelectorAll('.navBtnBox')
const navBtn = document.querySelectorAll('navBtn')

//  For Messages , Requests Animation Section

 navBtnBox.forEach(el =>{
  el.addEventListener('click', ()=>{
    const itemWidth =el.offsetWidth;
    const travelWidth =el.offsetLeft;
   

document.documentElement.style.setProperty('--travel-width', `${travelWidth}px`);
document.documentElement.style.setProperty('--item-width', `${itemWidth}px`);

setTimeout(() => {
el.classList.add('active');
el.classList.remove('text-black');
}, 200);



navBtnBox.forEach(bt=>{
  if(bt.classList.contains('active') && bt != el){
   bt.classList.add('text-black');
   bt.classList.remove('active');
  }
  
})


  })
 })




//  For 3 dot click box comes and goes 
 const button = document.querySelector(".more");
const targetElement = document.getElementById("moreBox");
const searchBox = document.getElementById("searchBox");

function anyClick(){
document.addEventListener('click', (event)=>{
   
    if(event.target.classList.contains('more')){
targetElement.classList.toggle('active');
console.log("clicked");
    }
   
    else if((event.target.id != "moreBox") && (!event.target.classList.contains('more'))){
        targetElement.classList.remove('active');
    }
   
  

})
}

anyClick();




