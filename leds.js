//
// This function will process the raw data in the LED array and store the results in 
// the array that will be used to control updates to display. 
// 
function decodeRawLeds(rawLeds)
{
  var char1;
  var char2;
  var nDataByte; 
  var lowNib; 
  var highNib; 
  var i; 
  var k; 
  
  k = 0; 
  const leds = []
  let control = {
    checkSystem: false,
    updateNames: false
  }
  
  //
  // Extract the nibbles from the raw data and convert them into the corresponding
  // class which will be used to control the display mode for the LED.   
  // 
  for(i=0; i<((rawLeds.length)); i++) 
  {
    char1 = rawLeds.charAt(i); 
    
    //
    // Convert the ASCII byte into the format which has each 
    // nibble represented as an ASCII byte.   For instance, the 
    // ASCII byte '3' which is made up of the binary data 0x34 
    // will be converted into a two byte ACSII array that has 
    // '3' and '4' as its contents.   
    //
    char2 = nibble( char1 ) 
    
    highNib = char2.charAt(0); 
    lowNib = char2.charAt(1); 
    
    leds[ k++ ] = decodeRawLed( highNib ); 
    
    //
    // Now "k" points to the next record which will be used to store
    // the lower nibble value unless it's the last record. 
    // 
    if( i == (rawLeds.length - 1))
    {
      control = controlNibble( lowNib); 
      
      // Make sure that the key does not get displayed.  
      leds[ k ] = "WEBS_NOKEY"; 
    }
    else 
    {
      leds[ k++ ] = decodeRawLed( lowNib ); 
    } 
  }
  
  //
  // See if any of the LEDs need to be updated.  If a change is detected, 
  // update with the new value.  Also, update the object which is used 
  // to store key state for the next time.
  // 
  // for(i=0; i<(KeyClassMapArray.length - 1); i++) 
  // {
  //   if( KeyClassMapArray[i] !== leds[i])
  //   {
  //     //
  //     // Update the class name in the actual object that is displayed 
  //     // 
  //     UpdateLedKeyDisplay( i ); 
      
  //     //
  //     // Update the variable that is used to track changes. 
  //     // 
  //     KeyClassMapArray[i] = leds[i];
  //   } 
  // }

  return {
    ...control,
    leds
  }
} 



  //
// This function will convert an ASCII byte into a string which contains the 
// two nibbles used for the input byte.  For instance, the byte '3' will be 
// converted to "33" which contains string representation of its binary 
// data.  The function is used to process the data used to encode key presses
// and only convert a limited range of data. 
//
function nibble( v ) 
{
  switch ( v )
  {
    case "3": return "33"; 
    case "4": return "34"; 
    case "5": return "35"; 
    case "6": return "36"; 
    
    case "C": return "43"; 
    case "D": return "44"; 
    case "E": return "45"; 
    case "F": return "46"; 
    
    case "S": return "53"; 
    case "T": return "54"; 
    case "U": return "55"; 
    case "V": return "56"; 
    
    case "c": return "63"; 
    case "d": return "64"; 
    case "e": return "65"; 
    case "f": return "66"; 
    
    default: return "00";
  }
} 

function decodeRawLed( v )
{
  switch ( v )
  {
    case "3": return null //  "WEBS_NOKEY"; 
    case "4": return false // "WEBS_OFF"; 
    case "5": return true // "WEBS_ON"; 
    case "6": return 2 // "WEBS_BLINK" ; 
    default: return null // "WEBS_NOKEY"; 
  }
} 



  //
// This function will process the control byte which is used for the local server. 
// The control byte is stored in the nibble used for the 24th element which is 
// not physically used for any key on any pool controller.  The control byte will
// be evaluated to determine if the client needed to request a screen refresh 
// from the web server (e.g., to process button name updates) and the status
// of the check system display element.   
// 
function controlNibble( v )
{
  //
  // There are only 23 keys for the PS-16.  The 24 element of the four 
  // by six array will always be set to WEBS_NOKEY.  The lower nibble of
  // the last element contains control data for the entire page.  For 
  // instance, it will be used to indicate that the entire page needs to
  // be refreshed, e.g., when button names have changed. 
  // 
  
  //
  // Get the object that holds the state and text for the check system warning. 
  // 
  
  //   W_NOLED - "3"  no check system  and no update names
  //   W_OFF   -  :4"  no check system  and update names
  //   W_ON     -  "5" check system  and no update names
  //   W_BLINK  - "6"  update names and check system on  
  
  switch( v )
  {
    case "3": return {
      checkSystem: false,
      updateNames: false
    }
    case "4": return {
      checkSystem: false,
      updateNames: true
    }
    case "5": return {
      checkSystem: true,
      updateNames: false
    }
    case "6": return {
      checkSystem: true,
      updateNames: true
    }
  }
  
  return {
    checkSystem: false,
    updateNames: false
  }
  
}

module.exports = {decodeRawLeds}