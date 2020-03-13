const nameRegex = /^[a-záéíóúñ]+[a-záéíóúñ]$/i;
const phoneRegex = /^[0][9][0-9]{7}[0-9]$/i;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^[a-z0-9ñ\.]{5,15}[a-z0-9ñ\.]$/i;
const deviceNameRegex = /^[a-z0-9áéíóúñ]{2,}/i; //POR LO MENOS UNA PALABRA QUE INICIA DE 2 LETRAS
const sirenIdRegex = /^[A-Z0-9]{8}$/;  //8 letras exactas y/o numeros mayúsculas
const iphoneRegex = /iphone/i;
const androidRegex = /android/i;

function validation_register(data) {
  if (!nameRegex.test(data.firstname)) return "* nombre no válido";
  else if (!nameRegex.test(data.lastname)) return "* apellido no válido";
  else if (!emailRegex.test(data.email)) return "* correo no válido";
  else if (!passwordRegex.test(data.password)) return "*contraseña 6 caracteres mínimo";
  else if (data.terms !== true) return "* términos y condiciones.";
  else return false;
}

function validation_login(data) {
  if (!emailRegex.test(data.email)) return "* Correo no válido";
  else if (!passwordRegex.test(data.password)) return "* La contraseña debe tener de 6 a 16 caracteres, el punto es admitido";
  else return false;
}

function validation_lost_pass(data) {
  if (!emailRegex.test(data.email)) return "* Correo no válido";
  else return false;
}

function deviceMatch(string) {
  if (iphoneRegex.test(string)) return "iphone";
  else if (androidRegex.test(string)) return "android";
  else return "none";
}

function validation_deviceAndButton(data) {
  if (!nameRegex.test(data.name_device)) return "* nombre del dispositivo no válido";
  else if (!phoneRegex.test(data.number_device)) return "* número no válido";
  else if (!nameRegex.test(data.siren_name)) return "* nombre de no válido";
  else if (!passwordRegex.test(data.siren_id)) return "*contraseña 6 caracteres mínimo";
  else if (data.terms !== true) return "* términos y condiciones.";
  else return false;
}
