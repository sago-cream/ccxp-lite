// Legacy top.php script observed 2026-10-11. Identity/session URLs sanitized.
var maxlifetime = 1800;
var idle = 0;
var start_time = new Date().getTime();
var timer;
var timer2;
var account = "";
var if_confirm = "1";
function update_timer() {
  $.ajax({
    url: "time.php?account=123456789&ACIXSTORE=fixture",
    success: function (data) {
      if (data.idle > maxlifetime) {
        clearInterval(timer);
        clearInterval(timer2);
        window.top.location = "logout.php?account=123456789&ACIXSTORE=fixture";
      }
      start_time = new Date().getTime();
      idle = data.idle;
    },
    complete: function () {},
  });
}
$(document).ready(function () {
  update_timer();
  timer = setInterval(function () {
    var now = new Date().getTime();
    var used_time = (now - start_time) / 1000 + idle;
    $("#idle").html((used_time / 60).toFixed(1) + "分");
    if (used_time < 60) {
      if_confirm = "1";
    }
    if (used_time > maxlifetime - 120) {
      update_timer();
      setTimeout(function () {
        var used_time = (now - start_time) / 1000 + idle;
        if (used_time > maxlifetime - 120 && if_confirm == "1") {
          if (confirm("閒置時間過長, 是否繼續?")) {
            location.reload();
          } else {
            if_confirm = "0";
          }
        }
      }, 2000);
    }
  }, 4000);
  timer2 = setInterval(update_timer, 6000);
});
