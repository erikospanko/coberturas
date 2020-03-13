const config = require("../config.json");
const path = require("path");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const generateUniqueId = require("generate-unique-id");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const fetch = require("node-fetch");
//const telegraf = require("telegraf");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(config.sendgrid_API_TOKEN);

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebase_url
});

const firebasedb = admin.database();

mongoose.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, err => {
  if (!err) {
    // console.log("MongoDB Connection Succeeded.");
  } else {
    // console.log("Error in DB connection : " + err);
  }
});

const sessionSchema = mongoose.Schema(
  {
    session_id: String,
    device_name: String,
    phone_number: String,
    device_match: String,
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const buttonSchema = mongoose.Schema(
  {
    siren_id: String,
    button_name: String,
    button_address: String
  },
  { _id: false }
);

var userSchema = new mongoose.Schema(
  {
    account: {
      firstname: String,
      lastname: String,
      email: String,
      password: String,
      level: { type: Number, default: 0 },
      enable: { type: Boolean, default: true },
      pay: { type: Boolean, default: false },
      date: { type: Date, default: Date.now }
    },
    sessions: {
      max: { type: Number, default: 2 },
      session: [sessionSchema]
    },
    buttons: {
      max: { type: Number, default: 1 },
      button: [buttonSchema]
    }
  },
  { collection: config.mongodb_collection_accounts },
  { versionKey: false }
);

var sirenSchema = new mongoose.Schema(
  {
    siren_id: String,
    address: String,
    phone: String,
    telegram_group_id: Number,
    upc: String,
    status: Boolean
  },
  { collection: config.mongodb_collection_sirens },
  { versionKey: false }
);

var usuario = mongoose.model("accounts", userSchema);
var sirena = mongoose.model("sirens", sirenSchema);

//////////////////routes//////////////////////////////////////

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/welcome.html"));
});

router.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

// active/:token_register
router.get("/active/:token_register", (req, res) => {
  // console.log("entro: /active/:token_register ");
  // console.log(`tu token es: ${req.params.token_register}`);
  jwt.verify(req.params.token_register, config.jwt_key, (err, data) => {
    if (err) {
      res.send("Error de autenticación");
    } else {
      // console.log(data);
      let now = new Date();
      let nowEpoch = Math.round(now.getTime() / 1000);
      // console.log(data.iat);
      // console.log(nowEpoch);

      //10 minutos para expirar activación registro
      if (data.iat + 1200 >= nowEpoch) {
        let user = new usuario(data);
        // console.log(data.account.email);
        usuario
          .findOne({ "account.email": data.account.email })
          .select("account.email")
          .exec()
          .then(docs => {
            // console.log(`respuesta de mongo: ${docs}`);

            if (docs != null) {
              res.sendFile(path.join(__dirname, "../views/registernoexpire.html"));
            } else {
              bcrypt.hash(data.account.password, 10, function(err, hash) {
                if (err) {
                  res.send("Error en encriptar contraseña, intentalo de nuevo");
                } else {
                  user.account.password = hash;
                  // console.log("contraseña encriptada: ");
                  // console.log(user.account.password);
                  user
                    .save()
                    .then(docs => {
                      // // console.log("datos guardados:");
                      // // console.log(docs);
                      res.sendFile(path.join(__dirname, "../views/registerok.html"));
                    })
                    .catch(err => {
                      res.send("ocurrio un error en db");
                    });
                }
              });
            }
          })
          .catch(err => {
            // console.log(`error: ${err}`);
            res.send("Intentalo de nuevo");
          });
      } else {
        res.sendFile(path.join(__dirname, "../views/registerexpire.html"));
      }
    }
  });
});

// function middleware(req, res, next) {
//   //// console.log(`tu token es: ${req.params.token_register}`);

//   jwt.verify(req.params.token_register, config.jwt_key, (err, data) => {
//     if (err) {
//       res.json({
//         error: "Error auth"
//       });
//     } else {
//       // console.log(`jwt data decoded: ${data}`);

//       res.json({
//         error: data
//       });
//     }
//   });

//   //next();
// }

//ajax /app/register en servidor
router.post("/app/register", (req, res) => {
  // console.log("entro en /app/register");
  // console.log(req.body);

  //validación en servidor

  let validation_msg = validation_register(req.body);

  if (validation_msg) {
    res.json({
      error: validation_msg
    });
  } else if (!validation_msg) {
    //busca en db si esta registrado
    // console.log("entro en /app/register db");
    usuario
      .findOne({ "account.email": req.body.email })
      .select("account.email")
      .exec()
      .then(docs => {
        // console.log(`respuesta de mongo: ${docs}`);

        if (docs != null) {
          res.json({
            error: "El usuario ya existe"
          });
        } else {
          // // console.log(req.body);
          let body_token = {
            account: req.body
          };

          //crea token de registro
          const token = jwt.sign(body_token, config.jwt_key);
          // console.log("entramosss");

          //envia mail para registrar datos
          let to = req.body.email;
          let from = "register@riotsystem.com";
          let subject = "Activación de cuenta";
          let html = `Hola ${req.body.firstname}, para activar tu cuenta riot, ingresa <a href="${config.domain}:${config.PORT_public}/sirena-riot/active/${token}">aquí</a>.`;
          sendMail(to, from, subject, html);

          res.json({
            registered: true
          });
        }
      })
      .catch(err => {
        // // console.log(`error: ${err}`);
        res.json({
          error: "Inténtelo mas tarde server"
        });
      });
  }
});
////////////////////////////
// //ajax /app/login en servidor
router.post("/app/login", (req, res) => {
  // console.log("entro en /app/login:");
  // console.log(req.body);
  //validación en servidor
  let validation_msg = validation_login(req.body);

  if (validation_msg) {
    res.json({
      error: validation_msg
    });
  } else if (!validation_msg) {
    //busca en db si esta registrado
    usuario.findOne({ "account.email": req.body.email }, "account sessions", function(err, doc) {
      if (err) {
        // console.log("error al buscar en db");
        res.json({
          error: "Inténtelo mas tarde"
        });
      } else {
        // console.log("item encontrado login:");
        // console.log(doc);
        if (doc == null) {
          // console.log("El usuario no existe");
          res.json({
            error: "Usuario y/o contraseña incorretos"
          });
        } else {
          //decode account.password
          let passCompare = bcrypt.compareSync(req.body.password, doc.account.password);
          if (passCompare) {
            // console.log(`session length: ${doc.sessions.session.length}`);
            if (doc.sessions.session.length < doc.sessions.max) {
              //crea session_id única
              let session_id = generateUniqueId({ length: 20 });

              //push a item into array *
              usuario.findOneAndUpdate(
                { "account.email": req.body.email },
                { $push: { "sessions.session": { session_id, device_match: req.body.device_match } } },
                { select: "sessions.session account sirens", new: true },
                function(err, docs) {
                  if (err) {
                    // console.log("error al agregar en db");
                    res.json({
                      error: "Inténtelo mas tarde"
                    });
                  } else {
                    // console.log("push array session");
                    // console.log(docs);
                    // console.log("------------------");
                    // console.log(docs._id);

                    res.json({
                      session_id,
                      id: docs._id
                    });
                  }
                }
              );
            } else {
              // console.log("Supera el numero de sesiones");
              res.json({
                error: "supera sesiones permitidas"
              });
            }
          } else {
            // console.log("La contraseña es incorrecta");
            res.json({
              error: "Usuario y/o contraseña incorretos"
            });
          }
        }
      }
    });
  }
});
////////////////////////////

//ajax new device data
router.post("/app/new_device", (req, res) => {
  // console.log("entro en /app/new_device:");
  // console.log(req.body);
  //validación en servidor
  let validation_msg = validation_newDevice(req.body);

  if (validation_msg) {
    res.json({
      error: validation_msg
    });
  } else if (!validation_msg) {
    //agrega objetos a un objeto dentro de un array *
    usuario.updateOne(
      { "sessions.session.session_id": req.body.session_id },
      { $set: { "sessions.session.$.device_name": req.body.device_name, "sessions.session.$.phone_number": req.body.phone_number } },
      function(err, doc) {
        if (err) {
          // console.log("error en agregar items en session array");
          res.json({
            error: "Inténtelo mas tarde"
          });
        } else {
          //// console.log(doc);
          res.json({
            created: true
          });
        }
      }
    );
  }
});

//ajax config_button data
router.post("/app/config-button", (req, res) => {
  // console.log("entro en /app/config-button:");
  // console.log(req.body);
  //validación en servidor
  let validation_msg = validation_configButton(req.body);

  if (validation_msg) {
    res.json({
      error: validation_msg
    });
  } else if (!validation_msg) {
    //existe sirena
    sirena.findOne({ siren_id: req.body.siren_id }, function(err, doc) {
      if (err) {
        // console.log("error en encontrar sirena");
        res.json({
          error: "Inténtelo mas tarde"
        });
      } else {
        if (doc != null) {
          usuario.updateOne({ "sessions.session.session_id": req.body.session_id }, { $set: { "buttons.button.0": req.body } }, function(err2, doc2) {
            // console.log("config-button data:");
            // console.log(doc2);
            if (err2) {
              // console.log("error en agregar items en button");
              res.json({
                error: "Inténtelo mas tarde"
              });
            } else {
              //// console.log(doc);
              res.json({
                config: true
              });
            }
          });
        } else {
          res.json({
            error: "id_sirena no válido"
          });
        }
      }
    });
  }
});

//ajax button-click
router.post("/app/button-click", (req, res) => {
  // console.log("entro en /app/button-click:");
  // console.log(req.body);
  // console.log("req.body.session_id: ");
  // console.log(req.body.session_id);

  //agrega objetos a un objeto dentro de un array *
  usuario.findOne({ "sessions.session.session_id": req.body.session_id }, "account buttons.button sessions.session.$.device_name", function(
    err,
    doc
  ) {
    // console.log("findOne:");
    // console.log(doc);
    if (err) {
      // console.log("error en findOne sirena session_id");
      res.json({
        error: "error en encontrar sirena"
      });
    } else {
      if (doc != null) {
        // console.log("entro no null");
        // console.log("doc.buttons.button[0]:");
        // console.log(doc.buttons.button[0]);
        if (!doc.buttons.button[0]) {
          res.json({
            error: "Configura tu botón de pánico"
          });
        } else if (req.body.click == "on" && doc.account.pay == true && doc.account.enable == true) {
          // console.log("click on:");
          sirena.findOne({ siren_id: doc.buttons.button[0].siren_id }, function(err2, doc2) {
            if (err2) {
              // console.log("error en encontrar id_sirena");
              res.json({
                error: "Intentalo mas tarde"
              });
            } else {
              if (doc2 != null) {
                //firebase
                firebasedb.ref(doc2.siren_id).set(true); //activa sirena firebase
                //telegram
                let msg = `Botón de pánico activado.\nCuenta: ${doc.account.firstname} ${doc.account.lastname}\nDispositivo: ${doc.sessions.session[0].device_name}\nDirección: ${doc.buttons.button[0].button_address}`;
                let encoded = encodeURI(msg);
                fetch(`https://api.telegram.org/bot${config.telegram_API_TOKEN}/sendMessage?chat_id=${doc2.telegram_group_id}&text=${encoded}`, {
                  method: "GET",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" }
                })
                  .then(response => response.json())
                  .then(data => {
                    // console.log(data);
                  })
                  .catch(err => {
                    // console.log(err);
                  });
                res.json({
                  clicked: "on"
                });
              } else {
                // console.log("id_sirena ya no existe, posiblemente fue cambiada o borrada");
                res.json({
                  error: "id_sirena no existe"
                });
              }
            }
          });
        } else if (req.body.click == "off" && doc.account.pay == true && doc.account.enable == true && doc.account.level >= 1) {
          //firebase
          sirena.findOne({ siren_id: doc.buttons.button[0].siren_id }, function(err2, doc2) {
            if (err2) {
              // console.log("error en encontrar id_sirena");
              res.json({
                error: "Intentalo mas tarde"
              });
            } else {
              if (doc2 != null) {
                //firebase
                firebasedb.ref(doc2.siren_id).set(false); //activa sirena firebase
                //telegram
                let msg = `Botón de pánico desactivado.\nCuenta: ${doc.account.firstname} ${doc.account.lastname}\nDispositivo: ${doc.sessions.session[0].device_name}\nDirección: ${doc.buttons.button[0].button_address}`;
                let encoded = encodeURI(msg);
                fetch(`https://api.telegram.org/bot${config.telegram_API_TOKEN}/sendMessage?chat_id=${doc2.telegram_group_id}&text=${encoded}`, {
                  method: "GET",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" }
                })
                  .then(response => response.json())
                  .then(data => {
                    // console.log(data);
                  })
                  .catch(err => {
                    // console.log(err);
                  });
                res.json({
                  clicked: "off"
                });
              } else {
                // console.log("id_sirena ya no existe, posiblemente fue cambiada o borrada");
                res.json({
                  error: "id_sirena no existe"
                });
              }
            }
          });
        } else if (doc.account.pay == false) {
          res.json({
            error: "Activa tu botón de pánico realizando tu aporte."
          });
        } else if (doc.account.enable == false) {
          res.json({
            error: "El administrador debe activar tu cuenta"
          });
        } else if (req.body.click == "off" && doc.account.pay == true && doc.account.enable == true && doc.account.level < 1) {
          res.json({
            error: "Solo los administradores pueden desactivar la sirena comunitaria"
          });
        } else {
          res.json({
            error: "algo salio mal, cierra sesión e ingresa de nuevo."
          });
        }
      } else {
        res.json({
          error: "error en encontrar sesión"
        });
      }
    }
  });
});

//ajax /api/sessions-del en servidor
router.post("/app/session-del", (req, res) => {
  // console.log("entro en : session-del");
  // console.log(req.body);

  usuario.updateOne(
    { "sessions.session.session_id": req.body.session_id },
    { $pull: { "sessions.session": { session_id: req.body.session_id } } },
    function(err, doc) {
      if (err) {
        res.json({
          error: "no fue posible eliminar sesión"
        });
      } else {
        res.json({
          clear: "ok"
        });
      }
    }
  );
});

//ajax /app/initial en servidor
router.post("/app/initial", (req, res) => {
  // console.log("entro en /app/initial");
  // console.log(req.body);
  let { session_id } = req.body;
  usuario.findOne({ "sessions.session.session_id": session_id }, function(err, doc) {
    if (err) {
      // console.log("error en db /app/initial");
      res.json({
        error: "error en db"
      });
    } else {
      if (doc != null) {
          // console.log("doc.buttons.button[0]");
          // console.log(doc.buttons.button[0]);
          res.json({
            data: doc.buttons.button[0]
          });
        
      } else {
        res.json({
          error: "no existe sesión"
        });
      }
    }
  });
});

//ajax /api/lost_pass en servidor
router.post("/app/lost_pass", (req, res) => {
  let lost_email = req.body.lost_email;

  //validación en servidor
  if (!emailRegex.test(lost_email)) {
    res.json({
      error: "correo no válido"
    });
  } else {
    // console.log(req.body);

    //busca en db si esta registrado
    usuario.findOne({ "account.email": lost_email }, function(err, doc) {
      if (err) {
        // console.log("error en lost_email db");
        res.json({
          error: "Hubo un error,inténtalo de nuevo"
        });
      } else {
        // console.log("doc lost_past");
        // console.log(doc);
        if (doc == null) {
          res.json({
            error: "usuario incorrecto"
          });
        } else {
          //crea token de registro
          let body_token = {
            account: lost_email
          };
          const token = jwt.sign(body_token, config.jwt_key);

          //envia mail para registrar datos
          let to = lost_email;
          let from = "asistencia@riotsystem.com";
          let subject = "Cambio de contraseña";
          // let html = `Cambia tu contraseña <a href="${config.domain}:${config.PORT_public}/sirena-riot/lost-pass/${token}">aquí</a>.`;
          let html = `Cambia tu contraseña <a href="${config.domain}:${config.PORT_public}/${config.app_path}/change/${token}">aquí</a>.`;
          sendMail(to, from, subject, html);
          res.json({
            sent: true
          });
        }
      }
    });
  }
});

// change/:token_register
router.get("/change/:token", (req, res) => {
  console.log("entro: /active/:token_register ");
  console.log(`tu token es: ${req.params.token_register}`);
  jwt.verify(req.params.token, config.jwt_key, (err, data) => {
    if (err) {
      res.send("Error de autenticación");
    } else {
      console.log(data);
      let now = new Date();
      let nowEpoch = Math.round(now.getTime() / 1000);
      // console.log(data.iat);
      // console.log(nowEpoch);

      //10 minutos para expirar activación registro
      if (data.iat + 600 >= nowEpoch) {
        res.sendFile(path.join(__dirname, "../views/changepass.html"));
      } else {
        res.sendFile(path.join(__dirname, "../views/registerexpire.html"));
      }
    }
  });
});

router.post("/change/:token", (req, res) => {
  console.log("entro: POST /active/:token_register ");
  console.log(`tu token es: ${req.params.token}`);
  jwt.verify(req.params.token, config.jwt_key, (err, data) => {
    if (err) {
      res.json({
        error: "tk: intentalo más tarde"
      });
    } else {
      // console.log(data);
      let now = new Date();
      let nowEpoch = Math.round(now.getTime() / 1000);
      // console.log(data.iat);
      // console.log(nowEpoch);

      //10 minutos para expirar activación registro
      if (data.iat + 600 >= nowEpoch) {
        bcrypt.hash(req.body.new_pass, 10, function(err, hash) {
          if (err) {
            res.json({
              error: "ky: intentalo más tarde"
            });
          } else {
            console.log("account.email:");
            console.log(data);
            console.log("nuevo hash:");
            console.log(hash);
            usuario.findOneAndUpdate({ "account.email": data.account }, {"account.password": hash , $unset:{"sessions.session": ""}}, function(err, doc) {
              console.log("doc:");
              console.log(doc);
              if (err) {
                res.json({
                  error: "db: intentalo más tarde"
                });
              } else {
                res.json({
                  saved: true
                });
              }
            });
          }
        });
      } else {
        res.json({
          error: "tu tiempo expiró"
        });
      }
    }
  });
});

///////////////////////////////////////////////////
function sendMail(to, from, subject, html) {
  const msg = {
    to,
    from,
    subject,
    html
  };
  sgMail.send(msg);
}

const nameRegex = /^[a-záéíóúñ]+[a-záéíóúñ]$/i; //empieza con una letra, seguido de una o mas letras(expresion anterior) y finaliza con una letra.
const phoneRegex = /^[0][0-9]{8}[0-9]$/;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^[a-z0-9ñ\.]{5,15}[a-z0-9ñ\.]$/i;
const deviceNameRegex = /^[a-z0-9áéíóúñ]{2,}/i; //POR LO MENOS UNA PALABRA QUE INICIA DE 2 LETRAS
const sirenIdRegex = /^[A-Z0-9]{8}$/; //8 letras exactas y/o numeros mayusculas

function validation_register(data) {
  if (!nameRegex.test(data.firstname)) return "* Nombre no válido";
  else if (!nameRegex.test(data.lastname)) return "* Apellido no válido";
  else if (!emailRegex.test(data.email)) return "* Correo no válido";
  else if (!passwordRegex.test(data.password)) return "* La contraseña debe tener de 6 a 16 caracteres, el punto es admitido";
  else if (data.terms !== "true") return "* Es necesario aceptar los términos y condiciones para registrarte";
  else return false;
}

function validation_login(data) {
  if (!emailRegex.test(data.email)) return "E-mail no válido";
  else if (!passwordRegex.test(data.password)) return "La contraseña debe tener de 6 a 16 caracteres, el punto es admitido";
  else return false;
}

function validation_lost_pass(data) {
  if (!emailRegex.test(data.email)) return "E-mail no válido";
  else return false;
}

function validation_newDevice(data) {
  if (!deviceNameRegex.test(data.device_name)) return "* Nombre del dispositivo no válido";
  else if (!phoneRegex.test(data.phone_number)) return "* Número de teléfono no válido";
  else return false;
}

function validation_configButton(data) {
  if (!deviceNameRegex.test(data.button_address)) return "* Dirección no válido";
  else if (!sirenIdRegex.test(data.siren_id)) return "* ID_sirena no válido";
  // else if (!deviceNameRegex.test(data.button_name)) return "* UPC no válido";
  else return false;
}

function validation_newButton(data) {
  if (!deviceNameRegex.test(data.siren_name)) return "* Nombre de la sirena no válido";
  else if (!deviceNameRegex.test(data.siren_address)) return "* Dirección no válida";
  else if (!sirenIdRegex.test(data.siren_id)) return "* ID sirena no válido";
  else return false;
}
module.exports = router;
