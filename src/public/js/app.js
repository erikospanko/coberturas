var list = document.getElementById("list");
var div_list = document.createElement("div");

const devices = [
  { id: "nc38n4cn83", name: "Casa Samborondón", state: "off" },
  { id: "k84m34cj3m", name: "Departamento Quito", state: "on" },
  { id: "m983mc030l", name: "Suite Salinas", state: "off" },
  { id: "nc84ncn394", name: "Depar Tonsupa", state: "on" },
  { id: "k84m34cj3m", name: "Casa Ñaño", state: "off" },
  { id: "nc38n4cn83", name: "Casa Papás", state: "on" },
  { id: "k84m34cj3m", name: "Departamento Quito", state: "off" },
  { id: "m983mc030l", name: "Suite Tumbaco", state: "off" },
  { id: "nc84ncn394", name: "Depar Tonsupa", state: "on" },
  { id: "k84m34cj3m", name: "Casa Ñaño", state: "off" }
];

devices.forEach((db, index) => {
  var item = document.createElement("div");
  item.className = `item_${index}`;
  item.id = `item_${index}`;
  // item.setAttribute("style", "height : 150px");

  var item_1 = document.createElement("span");
  item_1.className = "it_3";
  item_1.innerHTML =  index + 1 + ". " + db.name;
  // item_3.innerHTML = index +1 + ". " + db.name;

  var item_2 = document.createElement("span");
  item_2.className = `icon-volume-high it_1 state_${db.state}`;

  list.appendChild(item);
  item.appendChild(item_1);
  item.appendChild(item_2);

  document.getElementById(`item_${index}`).addEventListener("mousedown", () => {
    //alert(`Siren ${index} view`);
    solo_view(".button_view");
  });
});