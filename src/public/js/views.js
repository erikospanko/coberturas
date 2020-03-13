var audio = new Audio("/media/saved.mp3");
const path_app = "/sirena-riot/app";

function solo_none() {
  $(".container").css("display", "none");
}

function solo_view(view) {
  solo_none();
  $(view).fadeIn(500);
}

function dropDownMsg(msg) {
  $(".msg_view").css("display", "block");
  setTimeout(() => {
    $(".msg_drop").text(msg);
    $(".msg_view").addClass("moved");
    setTimeout(() => {
      $(".msg_view").removeClass("moved");
      setTimeout(() => {
        $(".msg_view").css("display", "none");
      }, 1000);
    }, 4000);
  }, 100);
}

function errorMsgSpam(msg) {
  $(".msg").text(msg);
  $(".msg").addClass("big");
  setTimeout(() => {
    $(".msg").removeClass("big");
  }, 500);
}

function errorWindow(message, nextView, durationSec) {
  $(".msgbig").text(message);
  solo_view(".error_view");
  setTimeout(() => {
    solo_view(nextView);
  }, 1000 * durationSec);
}

function loading() {
  solo_view(".login_view");
  setTimeout(() => {}, 4000);
}

function clear() {
  $("input").val("");
  $("input").prop("checked", false);
  $(".msg").text("");
}

function initialAjax() {
  $.ajax({
    url: `${path_app}/initial`,
    method: "POST",
    data: { session_id: localStorage.getItem("session_app_id") },
    success: function(fromServer) {
      if (fromServer.error) {
        errorMsgSpam("configura tu botón de pánico")
      } else if (fromServer.data) {
        $("#config_button_address").val(fromServer.data.button_address);
        $("#config_siren_id").val(fromServer.data.siren_id);
      }
    },
    error: function(err) {
      // errorWindow("el servidor no responde", ".button_view", 2);
    }
  });
}

// solo_view(".blackout");
// setTimeout(() => {
// }, 100):

// solo_view(".login_view");
// solo_view(".device_view");
// solo_view(".post_register_view");
// solo_view(".lost_pass_view");
// solo_view(".post_lost_pass_view");
// solo_view(".new_siren_view");
// solo_view(".button_view");
// solo_view(".config_siren_view");
//solo_view(".profile_view");
// solo_view(".config_device_view");
// solo_view(".loading_view");
// solo_view(".success_view");
//solo_view(".error_view");
//solo_view(".register_view");
// solo_view(".siren_list_view");
//solo_view(".sesions_open_view");

//dropDownMsg("Bienvenido ERIK");

//let session_app_id = localStorage.getItem("session_app_id");
if (localStorage.getItem("session_app_id")) {
  if (localStorage.getItem("device_name")) {
    solo_view(".button_view");
  } else {
    solo_view(".device_view");
  }
} else {
  solo_view(".main_view");
}
