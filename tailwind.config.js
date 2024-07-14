/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,js,ejs,ts,jsx,tsx}"],
  
  theme: {
    extend: {
      fontFamily: {
        pop: ["Poppins", "Roboto"],
        rob: ["Roboto"],
        nut: ["Nunito+Sans"],
      },
      fontWeight: {
        weight: ['100','200',"300", "400", "500", "600", "700", "800", "900"],
      },
      colors:{
blm:'#FBFBFC',
blf:'#4E61EA',
blg:'#F3F5F6',
blt:'#676B73',
blb:'#E4E4E4',
blh:'#E2E6FB',
bln:'#E8FBE7',
blin:'#DFAD34',
ble:'#D4260E',


      },
    },
  },
  plugins: [],
};
