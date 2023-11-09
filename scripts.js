client = new Paho.MQTT.Client("broker.emqx.io", Number(8084), "web_id");
const ad = document.getElementById('adelante');
const at = document.getElementById('atras');
const de = document.getElementById('derecha');
const iz = document.getElementById('izquierda');
const pa = document.getElementById('BtnParo');
var t1;
var t2;
var tA = false;
var tAT = false;
var tD = false;
var tI = false;
var presionado = 0;
var parobtn = 0;
let Sensores = [0, 0, 0, 0, 0]; //Lidar1, Lidar2, Bateria, Paro, Peso
let Tiras = [0, 0, 0, 0, 0];
var reinicio = 0;


// Manejo de eventos para teclado
document.addEventListener("keydown", KeyDown);
document.addEventListener("keyup", KeyUp);

// Función para realizar la acción deseada
client.connect({ onSuccess: onConnect, useSSL: true});

function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("sensors");
  client.subscribe("camera");

  client.onMessageArrived = async function (message) {
    // Mensaje recibido en algún canal
    //console.log("Mensaje recibido:", message.destinationName, message.payloadString);
    var puerto = message.destinationName;
    //console.log(puerto);
    if (puerto === "sensors") {
      switch (message.payloadString.substring(0, 3)) {
        case "li1":
          console.log(message.payloadString.substring(3) + "lid1");
          Sensores[0] = parseInt(message.payloadString.substring(3), 10);
          if (Sensores[0] < 150) {
            Tiras[0] = 2;
            sendTira();
            sendMessage("2Izquierda peligro");
          } else if (Sensores[0] < 200) {
            Tiras[0] = 1;
            sendTira();
            sendMessage("1Izquierda advertencia");
          } else {
            Tiras[0] = 0;
            sendTira();
            sendMessage("0Conectado");
          }
          break;
        case "li2":
          console.log(message.payloadString.substring(3) + "lid2");
          Sensores[1] = parseInt(message.payloadString.substring(3), 10);
          if (Sensores[1] < 150) {
            Tiras[1] = 2;
            sendTira();
            sendMessage("2Derecha peligro");
          } else if (Sensores[1] < 200) {
            Tiras[1] = 1;
            sendTira();
            sendMessage("1Derecha advertencia");
          } else {
            Tiras[1] = 0;
            sendTira();
            sendMessage("0Conectado");
          }
          break;
        case "bat":
          console.log(message.payloadString.substring(3) + "bat");
          Sensores[2] = parseInt(message.payloadString.substring(3), 10);
          if (Sensores[2] <= 15) {
            Tiras[2] = 2;
            sendTira();
            sendMessage("2Bateria menos de 15%");
          } else if (Sensores[2] <= 30) {
            Tiras[2] = 1;
            sendTira();
            sendMessage("1Bateria menos de 30%");
          } else if (Sensores[2] <= 45) {
            Tiras[2] = 0;
            sendTira();
            sendMessage("0Conectado");
          } else if (Sensores[2] <= 60) {
            Tiras[2] = 0;
            sendTira();
            sendMessage("0Conectado");
          } else if (Sensores[2] <= 75) {
            Tiras[2] = 0;
            sendTira();
            sendMessage("0Conectado");
          } else {
            Tiras[2] = 0;
            sendTira();
            sendMessage("0Conectado");
          }
          break;
        case "par":
          if(reinicio === 0){
            console.log(message.payloadString.substring(3));
            Sensores[3] = parseInt(message.payloadString.substring(3), 10);
            if (Sensores[3] === 2) {
              sendCommand('ALTO')
              Tiras[3] = 2;
              sendTira();
              sendMessage();
            } else if (Sensores[3] === 0) {
              if(parobtn === 0){
                reinicio = 1;
                manualparo();
              }else {
                Tiras[3] = 0;
                Sensores[3] = 1;
                sendMessage();
              }
            } else {

            }
          }
          break;
        case "pes":
          console.log(message.payloadString.substring(3));
          Sensores[4] = parseInt(message.payloadString.substring(3), 10);
          if (Sensores[4] > 35) {
            Tiras[4] = 2;
            sendTira();
          } else if (Sensores[4] >= 30) {
            Tiras[4] = 1;
            sendTira();
          } else {
            Tiras[4] = 0;
            sendTira();
          }
          break;
        default:
          console.log("El mensaje no es valido: " + message.payloadString);
          break;
      }
    }
    else if(puerto === "camera"){
      
    };
  }
  if (client.isConnected()) {
    sendMessage("0Conectado");
  } else {
    sendMessage("0No conectado");
  }
}

function delay(time){
  return new Promise(resolve =>
    setTimeout(resolve, time));
}

async function manualparo(){
  Tiras[3] = 0;
  sendMessage("0Reconectando.");
  await delay(4000);
  sendMessage("0Reconectando..");
  await delay(4000);
  sendMessage("0Reconectando...");
  await delay(4000);
  sendTira();
  sendMessage("0Conectado");
  const message = new Paho.MQTT.Message("1");
  message.destinationName = "rei";
  client.send(message);
  reinicio = 0;
}

function Camara(payload) {
  // Acciones a realizar con el mensaje del canal "cam"
  console.log("Mensaje del canal 'cam':", payload);
  // Realizar otras operaciones relacionadas al canal "cam"
  // Obten la referencia a la imagen por su ID
  const imagen = document.getElementById('miImagen');

  // Define la dirección URL de la imagen en una variable
  const urlImagen = "http://" + payload;

  // Asigna la dirección URL de la imagen a la etiqueta de imagen
  imagen.src = urlImagen;

}

function sendTira() {
  if (client.isConnected()) { // Verificar si el cliente MQTT está conectado
    let color = Math.max(...Tiras);
    if (color === 0) {
      const message = new Paho.MQTT.Message("V");
      message.destinationName = "tira";
      client.send(message);
      console.log("V");
    } else if (color === 1) {
      const message = new Paho.MQTT.Message("A");
      message.destinationName = "tira";
      client.send(message);
      console.log("A");
    } else if (color === 2) {
      const message = new Paho.MQTT.Message("R");
      message.destinationName = "tira";
      client.send(message);
      console.log("R");
    }
  } else {
    console.log("El cliente MQTT no está conectado. No se puede enviar el comando.");
    // Podrías intentar reconectar o mostrar un mensaje de error en este punto.
  }
}

function sendCommand(command) {
  if (Sensores[3] === 0) {
    if (client.isConnected()) { // Verificar si el cliente MQTT está conectado
      const message = new Paho.MQTT.Message(command);
      message.destinationName = "move";
      client.send(message);
      console.log('Acción: ' + command);
    } else {
      console.log("El cliente MQTT no está conectado. No se puede enviar el comando.");
      // Podrías intentar reconectar o mostrar un mensaje de error en este punto.
    }
  }
}

function sendMessage(command) {
  var h2mesanje = document.getElementById("miH2");
  let prioridad = Math.max(...Tiras);
  if (Sensores[3] === 0) {
    if (prioridad === 2) {
      if (parseInt(command.toString()[0]) === 2) {
        h2mesanje.style.color = "rgb(255, 0, 0)";
        h2mesanje.textContent = command.slice(1);
      }
    } else if (prioridad === 1) {
      if (parseInt(command.toString()[0]) === 1) {
        h2mesanje.style.color = "rgb(255, 213, 0)";
        h2mesanje.textContent = command.slice(1);
      }
    } else {
        h2mesanje.style.color = "rgb(89, 217, 44)";
        h2mesanje.textContent = command.slice(1);
    }
  } else if (Sensores[3] === 1) {
    h2mesanje.style.color = "rgb(255, 0, 0)";
    h2mesanje.textContent = "Paro interfaz";
  } else if (Sensores[3] === 2) {
    h2mesanje.style.color = "rgb(255, 0, 0)";
    h2mesanje.textContent = "Paro manual";
  }
}

pa.addEventListener('click', function () {
  if (Sensores[3] === 0) {
    sendCommand('ALTO')
    Sensores[3] = 1;
    parobtn = 1;
    sendMessage();
  } else if (Sensores[3] === 1) {
    Sensores[3] = 0;
    parobtn = 0;
    sendMessage("0Conectado");
  } else {
    sendMessage();
  }
});

function KeyDown(event) {
  event.preventDefault();
  if (event.key == "W" || event.key == "w" || event.key == "ArrowUp") {
    if (presionado == 0) {
      if (!tA) { // Verifica si la acción ya está en curso
        tA = true;
        presionado = 1;
        clearInterval(t1);
        t1 = setInterval(sendCommand('ADELANTE'), 100,); // Ejecuta cada 100 ms
      }
    }
  }
  if (event.key == "S" || event.key == "s" || event.key == "ArrowDown") {
    if (presionado == 0) {
      if (!tAT) { // Verifica si la acción ya está en curso
        tAT = true;
        presionado = 2;
        clearInterval(t1);
        t1 = setInterval(sendCommand('ATRAS'), 100); // Ejecuta cada 100 ms
      }
    }
  }
  if (event.key == "D" || event.key == "d" || event.key == "ArrowRight") {
    if (presionado == 0) {
      if (!tD) { // Verifica si la acción ya está en curso
        tD = true;
        presionado = 3;
        clearInterval(t1);
        t1 = setInterval(sendCommand('DERECHA'), 100); // Ejecuta cada 100 ms
      }
    }
  }
  if (event.key == "A" || event.key == "a" || event.key == "ArrowLeft") {
    if (presionado == 0) {
      if (!tI) { // Verifica si la acción ya está en curso
        tI = true;
        presionado = 4;
        clearInterval(t1);
        t1 = setInterval(sendCommand('IZQUIERDA'), 100); // Ejecuta cada 100 ms
      }
    }
  }
}

function KeyUp(event) {
  if (event.key == "W" || event.key == "w" || event.key == "ArrowUp") {
    if (presionado == 1) {
      tA = false;
      clearInterval(t1);
      presionado = 0;
      t1 = setInterval(sendCommand('ALTO'), 100);
    }
  }
  if (event.key == "S" || event.key == "s" || event.key == "ArrowDown") {
    if (presionado == 2) {
      tAT = false;
      clearInterval(t1);
      presionado = 0;
      t1 = setInterval(sendCommand('ALTO'), 100);
    }
  }
  if (event.key == "D" || event.key == "d" || event.key == "ArrowRight") {
    if (presionado == 3) {
      tD = false;
      presionado = 0;
      clearInterval(t1);
      t1 = setInterval(sendCommand('ALTO'), 100);
    }
  }
  if (event.key == "A" || event.key == "a" || event.key == "ArrowLeft") {
    if (presionado == 4) {
      tI = false;
      clearInterval(t1);
      presionado = 0;
      t1 = setInterval(sendCommand('ALTO'), 100);
    }
  }
}

// Manejo de eventos para dispositivos táctiles
ad.addEventListener('touchstart', function (event) {
  event.preventDefault();
  if (presionado == 0) {
    if (!tA) { // Verifica si la acción ya está en curso
      tA = true;
      clearInterval(t2);
      presionado = 5;
      t2 = setInterval(sendCommand('ADELANTE'), 100); // Ejecuta cada 100 ms
    }
  }
});

ad.addEventListener('touchend', function () {
  if (presionado == 5) {
    tA = false;
    clearInterval(t2);
    presionado = 0;
    t2 = setInterval(sendCommand('ALTO'), 100);
  }
});

// Manejo de eventos para ratón
ad.addEventListener('mousedown', function (event) {
  event.preventDefault();
  if (!tA) { // Verifica si la acción ya está en curso
    tA = true;
    clearInterval(t2);
    t2 = setInterval(sendCommand('ADELANTE'), 100); // Ejecuta cada 100 ms
  }
});

ad.addEventListener('mouseup', function () {
  tA = false;
  clearInterval(t2);
  t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
});

/////////////////////////////////////////////////////////////////////////////
// Función para realizar la acción deseada


// Manejo de eventos para dispositivos táctiles
at.addEventListener('touchstart', function (event) {
  event.preventDefault();
  if (presionado == 0) {
    if (!tAT) { // Verifica si la acción ya está en curso
      tAT = true;
      clearInterval(t2);
      presionado = 6;
      t2 = setInterval(sendCommand('ATRAS'), 100); // Ejecuta cada 100 ms
    }
  }
});

at.addEventListener('touchend', function () {
  if (presionado == 6) {
    tAT = false;
    clearInterval(t2);
    presionado = 0;
    t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
  }
});

// Manejo de eventos para ratón
at.addEventListener('mousedown', function (event) {
  event.preventDefault();
  if (!tAT) { // Verifica si la acción ya está en curso
    tAT = true;
    clearInterval(t2);
    t2 = setInterval(sendCommand('ATRAS'), 100); // Ejecuta cada 100 ms
  }
});

at.addEventListener('mouseup', function () {
  tAT = false;
  clearInterval(t2);
  t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
});

/////////////////////////////////////////////////////////////////////////////
// Función para realizar la acción deseada

// Manejo de eventos para dispositivos táctiles
de.addEventListener('touchstart', function (event) {
  event.preventDefault();
  if (presionado == 0) {
    if (!tD) { // Verifica si la acción ya está en curso
      tD = true;
      clearInterval(t2);
      presionado = 7;
      t2 = setInterval(sendCommand('DERECHA'), 100); // Ejecuta cada 100 ms
    }
  }
});

de.addEventListener('touchend', function () {
  if (presionado == 7) {
    tD = false;
    clearInterval(t2);
    presionado = 0;
    t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
  }
});

// Manejo de eventos para ratón
de.addEventListener('mousedown', function (event) {
  event.preventDefault();
  if (!tD) { // Verifica si la acción ya está en curso
    tD = true;
    clearInterval(t2);
    t2 = setInterval(sendCommand('DERECHA'), 100); // Ejecuta cada 100 ms
  }
});

de.addEventListener('mouseup', function () {
  tD = false;
  clearInterval(t2);
  t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
});

/////////////////////////////////////////////////////////////////////////////
// Función para realizar la acción deseada

// Manejo de eventos para dispositivos táctiles
iz.addEventListener('touchstart', function (event) {
  event.preventDefault();
  if (presionado == 0) {
    if (!tI) { // Verifica si la acción ya está en curso
      tI = true;
      clearInterval(t2);
      presionado = 8;
      t2 = setInterval(sendCommand('IZQUIERDA'), 100); // Ejecuta cada 100 ms
    }
  }
});

iz.addEventListener('touchend', function () {
  if (presionado == 8) {
    tI = false;
    clearInterval(t2);
    presionado = 0;
    t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
  }
});

// Manejo de eventos para ratón
iz.addEventListener('mousedown', function (event) {
  event.preventDefault();
  if (!tI) { // Verifica si la acción ya está en curso
    tI = true;
    clearInterval(t2);
    t2 = setInterval(sendCommand('IZQUIERDA'), 100); // Ejecuta cada 100 ms
  }
});

iz.addEventListener('mouseup', function () {
  tI = false;
  clearInterval(t2);
  t2 = setInterval(sendCommand('ALTO'), 100); // Ejecuta cada 100 ms
});

function changevel() {
  if (Sensores[3] === 0) {
    let Velocida = document.getElementById("selvel");
    let velocidad = Velocida.value;
    message = new Paho.MQTT.Message(velocidad);
    message.destinationName = "speed";
    client.send(message);
    console.log(velocidad);
  }
}