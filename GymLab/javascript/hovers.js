$(document).on("DOMContentLoaded", function () {

  // .opcion-usuario a
  $(".opcion-usuario a")
    .on("mouseenter", function () {
      $(this).css("color", "grey");
    })
    .on("mouseleave", function () {
      $(this).css("color", "");  // al dejarlo sin valor restaura el color original del CSS sin tener que cambiarlo especificamente
    });

  // .menu-lateral a
  $(".menu-lateral a")
    .on("mouseenter", function () {
      $(this).css("color", "#8c7065");
    })
    .on("mouseleave", function () {
      $(this).css("color", "");
    });

  // .boton-oscuro
  $(".boton-oscuro")
    .on("mouseenter", function () {
      $(this).css({ "background-color": "#d9b384", "color": "#000", "box-shadow": "none" });
    })
    .on("mouseleave", function () {
      $(this).css({ "background-color": "", "color": "", "box-shadow": "" });
    });

  // .boton-claro
  $(".boton-claro")
    .on("mouseenter", function () {
      $(this).css({ "background-color": "#d9b384", "color": "#000", "border": "3px #000 solid" });
    })
    .on("mouseleave", function () {
      $(this).css({ "background-color": "", "color": "", "border": "" });
    });
    
  // .form-footer button
  $(".form-footer button")
    .on("mouseenter", function () {
      $(this).css( "background-color", "#333" );
    })
    .on("mouseleave", function () {
      $(this).css("background-color", "");
    });

});