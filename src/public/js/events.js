//main_view.............................
$("#button_log_init").click(function() {
  clear();
  solo_view(".login_view");
});

$("#button_reg_init").click(function() {
  clear();
  solo_view(".register_view");
});

//login_view.........................
$("#back_login").click(function() {
  clear();
  solo_view(".main_view");
});

$("#lost_pass_link").click(function() {
  clear();
  solo_view(".lost_pass_view");
});

$("#button_log").on("click", e => {
  e.preventDefault();
  $("#button_log").prop('disabled', true);
  let device_match = deviceMatch(navigator.userAgent);
  let form = [];
  let result = {};
  let key = ["email", "password", "device_match"];

  $("#form_log :input").each(function(i) {
    let input = $(this);
    form.push(input[0].value);
  });
  form.splice(-1, 1, device_match);
  key.forEach((key, i) => (result[key] = form[i]));

  let valid = validation_login(result);

  if (valid) {
    errorMsgSpam(valid);
    $("#button_log").prop('disabled', false);
  } else if (valid == false) {
    $.ajax({
      url: `${path_app}/login`,
      method: "POST",
      data: result,
      success: function(fromServer) {
        if (fromServer.error) {
          solo_view(".loading_view");
          setTimeout(() => {
            errorWindow(`${fromServer.error}`, ".login_view", 2);
            $("#button_log").prop('disabled', false);
          }, 1000);
        } else if (fromServer.session_id) {
          solo_view(".loading_view");
          setTimeout(() => {
            solo_view(".device_view");
            localStorage.clear();
            clear();
            localStorage.setItem("session_app_id", fromServer.session_id);
            localStorage.setItem("email_account", result.email);
            $("#button_log").prop('disabled', false);
          }, 1000);
        }
      },
      error: function(err) {
        errorWindow("el servidor no responde", ".login_view", 2);
        $("#button_log").prop('disabled', false);
      }
    });
  }
});

//register_view..........................
$("#back_register").click(function() {
  clear();
  solo_view(".main_view");
});

$("#button_reg").on("click", e => {
  e.preventDefault();
  $("#button_reg").prop('disabled', true);
  let form = [];
  let result = {};
  let key = ["firstname", "lastname", "email", "password", "terms"];
  let box = $("#accept_terms").prop("checked");

  $("#form_reg :input").each(function(i) {
    let input = $(this);
    form.push(input[0].value);
  });
  form.splice(-2, 2, box);
  key.forEach((key, i) => (result[key] = form[i]));

  let valid = validation_register(result);

  if (valid) {
    errorMsgSpam(valid);
    $("#button_reg").prop('disabled', false);
  } else if (valid == false) {
    $.ajax({
      url: `${path_app}/register`,
      method: "POST",
      data: result,
      success: function(fromServer) {
        if (fromServer.error) {
          solo_view(".loading_view");
          setTimeout(() => {
            errorWindow(`${fromServer.error}`, ".register_view", 2);
            $("#button_reg").prop('disabled', false);
          }, 1000);
        } else if (fromServer.registered == true) {
          solo_view(".loading_view");
          setTimeout(() => {
            $("#registered_firstname").text(result.firstname);
            $("#registered_email").text(result.email);
            solo_view(".post_register_view");
            $("#button_reg").prop('disabled', false);
            clear();
          }, 1000);
        }
      },
      error: function(err) {
        errorWindow("el servidor no responde", ".register_view", 2);
        $("#button_reg").prop('disabled', false);
      }
    });
  }
});

//lost_pass_view................................
$("#back_lost_pass").click(function() {
  clear();
  solo_view(".login_view");
});

$("#button_lost_pass").on("click", e => {
  e.preventDefault();
  $("#button_lost_pass").prop('disabled', true);
  let lost_email = $("#email_lost_pass").val();
  if (!emailRegex.test(lost_email)) {
    test = "* email no válido";
    errorMsgSpam(test);
    $("#button_lost_pass").prop('disabled', false);
  } else {
    $.ajax({
      url: `${path_app}/lost_pass`,
      method: "POST",
      data: {lost_email},
      success: function(fromServer) {
        if (fromServer.error) {
          solo_view(".loading_view");
          setTimeout(() => {
            errorWindow(`${fromServer.error}`, ".lost_pass_view", 2);
            $("#button_lost_pass").prop('disabled', false);
          }, 1000);
        } else if (fromServer.sent) {
          clear();
          $("#post_lost_pass_email").text(lost_email);
          solo_view(".post_lost_pass_view");
          $("#button_lost_pass").prop('disabled', false);
        }
      },
      error: function(err) {
        $(".msg").text("");
        errorWindow("el servidor no responde", ".lost_pass_view", 2);
        $("#button_lost_pass").prop('disabled', false);
      }
    });
  }
});

//lost_pass_post_view...............................
$("#button_lost_pass_post").click(function() {
  clear();
  solo_view(".login_view");
});

//post_register_view...............................
$("#button_reg_post").click(function() {
  clear();
  solo_view(".login_view");
});

////////device_view................................
$("#button_device").on("click", e => {
  e.preventDefault();
  $("#button_device").prop('disabled', true);
  let device_name = $("#name_device").val();
  let phone_number = $("#number_device").val();
  let test;

  if (!deviceNameRegex.test(device_name)) {
    test = "* nombre del dispositivo no válido";
    errorMsgSpam(test);
    $("#button_device").prop('disabled', false);
  } else if (!phoneRegex.test(phone_number)) {
    test = "* número no válido";
    errorMsgSpam(test);
    $("#button_device").prop('disabled', false);
  } else {
    let result = {
      session_id: localStorage.getItem("session_app_id"),
      device_name,
      phone_number
    };
    $.ajax({
      url: `${path_app}/new_device`,
      method: "POST",
      data: result,
      success: function(fromServer) {
        if (fromServer.error) {
          solo_view(".loading_view");
          setTimeout(() => {
            errorWindow(`${fromServer.error}`, ".device_view", 2);
            $("#button_device").prop('disabled', false);
          }, 1000);
        } else if (fromServer.created) {
          clear();
          localStorage.setItem("device_name", device_name);
          solo_view(".success_view");
          audio.play();
          setTimeout(() => {
            solo_view(".button_view");
            $("#button_device").prop('disabled', false);
          }, 2000);
        }
      },
      error: function(err) {
        errorWindow("el servidor no responde", ".device_view", 2);
        $("#button_device").prop('disabled', false);
      }
    });
  }
});

//siren_list_view...............................
$("#account-icon").click(function() {
  clear();
  $("#account_prof").text(localStorage.getItem("email_account"));
  $("#device_name_prof").text(localStorage.getItem("device_name"));
  solo_view(".profile_view");
});

$("#add-item-icon").click(function() {
  clear();
  solo_view(".new_siren_view");
});

$("#refresh-icon").click(function() {
  clear();
  solo_view(".loading_view");
  setTimeout(() => {
    solo_view(".siren_list_view");
  }, 2000);
});

//profile_view...............................
$("#back_profile").click(function() {
  clear();
  solo_view(".button_view");
});
$("#button_prof_conf").click(function() {
  clear();
  solo_view(".config_device_view");
});
$("#button_prof_dev").click(function() {
  clear();
  solo_view(".sessions_view");
});
$("#button_prof_close").click(function() {
  clear();
  let session_id = localStorage.getItem("session_app_id");
  $("#button_prof_close").prop('disabled', true);
  $.ajax({
    url: `${path_app}/session-del`,
    method: "POST",
    data: { session_id },
    success: function(fromServer) {
      if (fromServer.error) {
        solo_view(".loading_view");
        localStorage.clear();
        solo_view(".main_view");
        $("#button_prof_close").prop('disabled', false);
      } else if (fromServer.clear) {
        clear();
        localStorage.clear();
        solo_view(".success_view");
        audio.play();
        setTimeout(() => {
          solo_view(".main_view");
          $("#button_prof_close").prop('disabled', false);
        }, 2000);
      }
    },
    error: function(err) {
      errorWindow("el servidor no responde", ".profile_view", 2);
      $("#button_prof_close").prop('disabled', false);
    }
  });

  //solo_view(".main_view");
});

//new_siren_view...............................
$("#back_new_siren").click(function() {
  solo_view(".device_view");
});

// $("#button_new_siren").on("click", e => {
//   e.preventDefault();
//   let siren_name = $("#siren_name").val();
//   let siren_address = $("#siren_address").val();
//   let siren_id = $("#siren_id")
//     .val()
//     .toUpperCase();
//   let test;

//   if (!deviceNameRegex.test(siren_name)) {
//     test = "* nombre de la sirena no válido";
//     errorMsgSpam(test);
//   } else if (!deviceNameRegex.test(siren_address)) {
//     test = "* dirección no válida";
//     errorMsgSpam(test);
//   } else if (!sirenIdRegex.test(siren_id)) {
//     test = "* id no válido";
//     errorMsgSpam(test);
//   } else {
//   }
// });

//config_mobile_view...............................
$("#back_config_mobile").click(function() {
  clear();
  solo_view(".profile_view");
});

// $("#button_config_mobile").on("click", e => {
//   e.preventDefault();

//   clear();
//   solo_view(".success_view");
//   audio.play();
//   setTimeout(() => {
//     solo_view(".profile_view");
//   }, 2000);
// });

//sessions_view...............................
$("#back_sessions").click(function() {
  clear();
  solo_view(".profile_view");
});

//button_view...............................
$("#back_button").click(function() {
  clear();
  solo_view(".siren_list_view");
});

$("#config_button").click(function() {
  //clear();
  //console.log("config in");
  initialAjax();
  solo_view(".config_siren_view");
});

$("#siren_button").click(function() {
  $("#siren_button").prop('disabled', true);
  let session_id = localStorage.getItem("session_app_id");
  solo_view(".loading_view");
  if ($("#siren_button").hasClass("on")) {
    $.ajax({
      url: `${path_app}/button-click`,
      method: "POST",
      data: { session_id, click: "off" },
      success: function(fromServer) {
        solo_view(".button_view");
        if (fromServer.error) {
          errorMsgSpam(fromServer.error);
        } else if (fromServer.clicked) {
          clear();
          $("#siren_button").removeClass("on");
          $("#siren_status").text("sirena desactivada");
        }
        $("#siren_button").prop('disabled', false);
      },
      error: function(err) {
        errorMsgSpam("el servidor no responde");
        $("#siren_button").prop('disabled', false);
      }
    });
  } else {
    $.ajax({
      url: `${path_app}/button-click`,
      method: "POST",
      data: { session_id, click: "on" },
      success: function(fromServer) {
        solo_view(".button_view");
        if (fromServer.error) {
          errorMsgSpam(fromServer.error);
        } else if (fromServer.clicked) {
          clear();
          $("#siren_button").addClass("on");
          $("#siren_status").text("sirena activada");
        }
        $("#siren_button").prop('disabled', false);
      },
      error: function(err) {
        errorMsgSpam("el servidor no responde");
        $("#siren_button").prop('disabled', false);
      }
    });
  }
});

//config_siren_view...............................
$("#back_config_siren").click(function() {
  //clear();
  solo_view(".button_view");
});

$("#button_config_siren").on("click", e => {
  e.preventDefault();
  $("#button_config_siren").prop('disabled', true);
  let button_address = $("#config_button_address").val();
  // let button_name = $("#config_button_name").val();
  let siren_id = $("#config_siren_id")
    .val()
    .toUpperCase();
  let test;
  if (!deviceNameRegex.test(button_address)) {
    test = "* dirección no válida";
    errorMsgSpam(test);
    $("#button_config_siren").prop('disabled', false);
  } else if (!sirenIdRegex.test(siren_id)) {
    test = "* id_sirena no válido";
    errorMsgSpam(test);
    $("#button_config_siren").prop('disabled', false);
    // } else if (!deviceNameRegex.test(button_name)) {
    //   test = "* nombre no válido";
    //   errorMsgSpam(test);
  } else {
    $(".msg").text("");
    let result = {
      session_id: localStorage.getItem("session_app_id"),
      button_address,
      siren_id
      // button_name
    };
    $.ajax({
      url: `${path_app}/config-button`,
      method: "POST",
      data: result,
      success: function(fromServer) {
        if (fromServer.error) {
          solo_view(".loading_view");
          setTimeout(() => {
            errorWindow(`${fromServer.error}`, ".config_siren_view", 2);
            $("#button_config_siren").prop('disabled', false);
          }, 1000);
        } else if (fromServer.config) {
          clear();
          solo_view(".success_view");
          audio.play();
          setTimeout(() => {
            solo_view(".button_view");
            $("#button_config_siren").prop('disabled', false);
          }, 2000);
        }
      },
      error: function(err) {
        errorWindow("el servidor no responde", ".config_siren_view", 2);
        $("#button_config_siren").prop('disabled', false);
      }
    });
  }
});

//accept_terms..............................
$(".accept_terms").click(function() {
  solo_view(".terms_view");
});

$("#back_terms").click(function() {
  solo_view(".register_view");
});
