const passRegex = /^[a-z0-9ñ\.]{5,15}[a-z0-9ñ\.]$/i;
$("#button_new_pass").on("click", e => {
  e.preventDefault();
  const new_pass = $("#new_pass").val();
  if (passRegex.test(new_pass)) {
    $.ajax({
      url: window.location.href,
      method: "POST",
      data: { new_pass },
      success: function(fromServer) {
        if (fromServer.error) {
          $(".msg").text(fromServer.error);
        } else if (fromServer.saved) {
          $("#button_new_pass").val("");
          $("#form_change").css("display", "none");
          $("h2").css("display", "none");
          $(".msg").text("tu nueva contraseña ha sido guardada exitosamente");
        }
      },
      error: function(err) {
        $(".msg").text("intentalo más tarde");
      }
    });
  } else {
    $(".msg").text("La contraseña debe ser mayor a 6 caracteres y menor a 16, el unico caracter especial que se puede usar es el punto.");
  }
});
