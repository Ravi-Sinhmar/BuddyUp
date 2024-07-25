
function getTimeDifference(createdAt) {
    // Convert the createdAt timestamp to a Date object
    const then = new Date(createdAt);
  
    // Get the current time in milliseconds
    const now = Date.now();
  
    // Calculate the difference in milliseconds
    const difference = now - then;
  
    // Define thresholds for different time units (seconds, minutes, hours, days)
    const secondInMs = 1000;
    const minuteInMs = secondInMs * 60;
    const hourInMs = minuteInMs * 60;
    const dayInMs = hourInMs * 24;
  
    // Calculate the time units based on the difference
    let seconds = Math.floor(difference / secondInMs);
    let minutes = Math.floor(difference / minuteInMs);
    let hours = Math.floor(difference / hourInMs);
    let days = Math.floor(difference / dayInMs);
  
    // Determine the appropriate time unit and format the string
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `${seconds} sec${seconds > 1 ? 's' : ''} ago`;
    }
  }

  function getHourDifference(createdAt) {
    const then = new Date(createdAt);
    const now = Date.now();
    const differenceInMs = now - then;
  
    const hours = Math.floor(differenceInMs / (1000 * 60 * 60));
    const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
  
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // Include options for desired time format
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric', // Display hours as numbers
        minute: '2-digit', // Pad minutes with leading zeros if needed
        hour12: true   // Use 12-hour format (e.g., 2:40 PM)
      };
      const thenTimeString = then.toLocaleTimeString('en-IN', options);
      return thenTimeString;
    }
  }

  function getLocalTimeString(createdAt) {
    const then = new Date(createdAt);
    const now = Date.now();
    const differenceInMs = now - then;
  
    const hours = Math.floor(differenceInMs / (1000 * 60 * 60));
    const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
  
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // Include options for desired time format
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric', // Display hours as numbers
        minute: '2-digit', // Pad minutes with leading zeros if needed
        hour12: true   // Use 12-hour format (e.g., 2:40 PM)
      };
      const thenTimeString = then.toLocaleTimeString('en-IN', options);
      return thenTimeString;
    }
  }

  
  


  function extractString(combinedString) {
    if (typeof combinedString !== "string") {
      console.log("Either id is not string");
      return null; // Or handle the error as needed
    }
  
    const parts = combinedString.split('-');
  
    if (parts.length !== 2) {
      console.log("Invalid format: Expected two parts separated by a hyphen");
      return null; // Or handle the error as needed
    }
  
    const [str1, str2] = parts;
  
    return [str1, str2];
  }

  function getFid(rid, sid) {
    if (typeof rid !== "string" && typeof sid !== "string") {
      return { error: "Invalid input: combinedString must be a string" };
    }
  
    const parts = rid.split("-");
  
    if (parts.length !== 2) {
      return {
        error: "Invalid format: expected a single hyphen in the combined string",
      };
    }
  
    if (parts[0] === sid) {
      return parts[1];
    } else if (parts[1] === sid) {
      return parts[0];
    }
  }

  module.exports = {getTimeDifference , getHourDifference, extractString,getLocalTimeString, getFid};