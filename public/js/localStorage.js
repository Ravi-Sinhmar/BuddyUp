// set in local Storage, user -> object to store
const setLocalData = (user) => {
    localStorage.setItem('localData', JSON.stringify(user));
  };


  
  // Retrive data form  local Storage
  const getLocalData = () => {
    const storedUserData = localStorage.getItem('localData');
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      return userData;
    } else {
      console.error("No user data found in local storage");
      return null; // Or handle the case where no data is available
    }
  };
