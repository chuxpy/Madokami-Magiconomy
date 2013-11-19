var people_names = [["Kaname", "Akemi", "Miki", "Tomoe", "Sakura", "Kamijo", "Shizuki", "Kanna", "Usagi", "Wakaba", "Asami", "Misaki", "Maki", "Yuuki"],
                   ["Madoka", "Homura", "Sayaka", "Mami", "Nagisa", "Kazuko", "Tatsuya", "Tomohisa", "Junko", "Hitomi", "Kyosuke", "Saki", "Kaoru", "Umika", "Michiru", "Nico", "Satomi", "Kanna", "Yuri", "Akari", "Akahana", "Aiko", "Aki"]]

var corporation_names = [["Big","Super","Extreme","Fashionable","Grandiose","Incredible","Inventive"],
                         ["Tacos","Fish","Lamps","Quills and Sofas","Otakus","Sun Lamps","Programmers","Dresses","Pipets","Cutlery","Tony's","Albert's","Pizzas","Roasted Pork","Fairy Wands","Lightsabers","Kiryuiin's","Ryuuoko's","Pineapples","Questionable Beef","Trampolines","Greasy Dishes","Cameras","Vegetables","CDs"],
                         ["Express","LTD","Direct","Outlet","Warehouse","(c)"]]

var person_name_gen = function(){return people_names[0][Math.floor(people_names[0].length * Math.random())]+" "+people_names[1][Math.floor(people_names[1].length * Math.random())]}
var corporation_name_gen = function(){
  var corporation_name = corporation_names[0][Math.floor(corporation_names[0].length * Math.random())]+" "+corporation_names[1][Math.floor(corporation_names[1].length * Math.random())]
  if(!Math.floor(3*Math.random()))corporation_name += " " + corporation_names[2][Math.floor(corporation_names[2].length * Math.random())]
  return corporation_name}
var bank_name_gen = function(){return people_names[0][Math.floor(people_names[0].length * Math.random())]+" Bank"}

counter = 0
inc_counter = function(){
  counter+=1
  return counter
}

var initial_corporation_cash = 10000000,
    initial_individual_cash = 100000,
    initial_bank_cash = 1000000,
    initial_government_cash = 0,
    initial_exchange_rate = 0.12

/*function gen_pattern(sum){
  return function pattern(fraction_tuple, curr_sum){
    var new_frac = Math.random()
    if(typeof fraction_tuple == "undefined") var fraction_tuple = []
    if(typeof curr_sum == "undefined") var curr_sum = 0
    if(new_frac > sum-curr_sum){
      new_frac = sum-curr_sum
    }
    if(sum-curr_sum < 0.001){
      return fraction_tuple
    }
    fraction_tuple.push(new_frac)
    return pattern(fraction_tuple, curr_sum+new_frac)
  }
}*/

var bigc = {bank:
              {name: bank_name_gen,
               cash: function(){return initial_bank_cash},
               "_id": inc_counter,
               "_type": function(){return "vertex"},
               label: function(){return "bank"}},
            individual:
              {name: person_name_gen,
               cash: function(){return initial_individual_cash},
               bank_cash: function(){return 0.0},
               wages: function(){return Math.floor(25000+Math.random()*20000)/365.25},
               consumption: function(){return 0.3+0.5*Math.random()},
               label: function(){return "individual"},
               "_id": inc_counter,
               "_type": function(){return "vertex"}},
            government:
              {name: function(){return "Madokami Government"},
               cash: function(){return initial_government_cash},
               label: function(){return "government"},
               "_id": inc_counter,
               "_type": function(){return "vertex"}},
            corporation:
              {name: corporation_name_gen,
               cash: function(){return initial_corporation_cash},
               bank_cash: function(){},
               label: function(){return "corporation"},
               "_id": inc_counter,
               "_type": function(){return "vertex"}}}

function create_object(what_to_make){
  var created_obj = {}
  for(var prop_name in bigc[what_to_make]){
    created_obj[prop_name] = bigc[what_to_make][prop_name]()
  }
  return created_obj
}

function gen_obj(obj_name, number_of_objs){
  var objs = []
  for(var i=0;i<number_of_objs;i++){
    objs.push(create_object(obj_name))
  }
  return objs
}

function gen_banks(number_of_banks){
  return gen_obj("bank", number_of_banks)
}

function gen_corporations(number_of_corporations){
  return gen_obj("corporation", number_of_corporations)
}

function gen_individuals(number_of_individuals){
  return gen_obj("individual", number_of_individuals)
}

function gen_government(){
  return gen_obj("government", 1)
}

// Now we can simply generate all the vertices of the MM graph. However, we also need to be able to make connections through directed edges.

var num = {}
    num.banks = 20,
    num.corporations = 50,
    num.individuals = 300

var edge_template = {
  "_id": inc_counter,
  "_type": function(){return "edge"},
  "_outV": null,
  "_inV": null,
  "_label": null
}

function create_edge(from, to, label, weight){
  var created_edge = {}
  for(var prop_name in edge_template){
    if(prop_name == "_outV") created_edge["_outV"] = from
    else if(prop_name == "_inV") created_edge["_inV"] = to
    else if(prop_name == "_label") created_edge["_label"] = label
    else created_edge[prop_name] = edge_template[prop_name]()
  }
  if(typeof weight != 'undefined'){
    created_edge.weight = weight
  }
  return created_edge
}

/*
Single (iterate over each one)
#I -uses-> B[rand]
#I -isIndividualOf-> G
#C -uses-> B[rand]
#B -isBankOf-> G
#C -isCorporationOf-> G

One-to-many (iterate over each one)
I -consumes-> C[rand][rand-amount]
C -invests-> C[rand-not-this-C][rand-amount]
*/

/*
When setting values, let it be known that one graph traversal is on the order of one day.
Daily wages would therefore be 1/365 of a yearly wage.
Daily consumption is the sum total of
*/

var bank_ids = [1,num.banks],
    corporation_ids = [num.banks+1,num.banks+num.corporations],
    individual_ids = [num.banks+num.corporations+1,num.banks+num.corporations+num.individuals],
    government_id = num.banks+num.corporations+num.individuals+1

function pick_random(some_array){
  var start_index = some_array[0],
      end_index = some_array[1]
  return Math.floor((end_index - start_index + 1) * Math.random() + start_index)
}

function link_vertices(){
  var edges = []
  for(var i=1;i<num.banks+1;i++){
    //Iterate over all the banks
    edges.push(create_edge(i,government_id,"isBankOf"))
  }
  for(var i=num.banks+1;i<num.banks+num.corporations+1;i++){
    //Iterate over all the corporations
    edges.push(create_edge(i,government_id,"isCorporationOf"))
    edges.push(create_edge(i,pick_random(bank_ids),"uses"))
  }
  for(var i=num.banks+num.corporations+1;i<num.banks+num.corporations+num.individuals+1;i++){
    //Iterate over all the individuals
    edges.push(create_edge(i,government_id,"isIndividualOf"))
    edges.push(create_edge(i,pick_random(bank_ids),"uses"))
  }
  return edges
}

function initialize_world(){
  var banks = gen_banks(num.banks),
      corporations = gen_corporations(num.corporations),
      individuals = gen_individuals(num.individuals),
      government = gen_government()
  // Since these all are well-ordered, it's easy to connect with just ID's.
  return [banks.concat(
          corporations.concat(
          individuals.concat(
          government))),
          link_vertices()]
}

var mm_ve = initialize_world()

mm_graph = {"graph": {"mode": "NORMAL",
                      "vertices": mm_ve[0],
                      "edges": mm_ve[1]}}


//THE GRAPH TRAVERSAAALS

function individual_cash(g){
  g.V(government_id).in('isIndividualOf').property("cash").then(function(result){console.log(result)})
}
function corporation_cash(g){
  g.V(government_id).in('isCorporationOf').property("cash").then(function(result){console.log(result)})
}

function pay(g){
  g.V(government_id).transform("w=[]").then(function(result){})
  g.V(government_id).in("isIndividualOf").transform("it.cash+=w.push(it.wages)")
  .then(function(result){})
  g.V(government_id).in("isCorporationOf").transform("it.cash-=w.shift()")
  .then(function(result){console.log(result)})
}

function consume(g){
  //every individual consumes an amount of money by giving their coefficient of their wages to a random corporation.
  g.V(government_id).transform("c=[]").then(function(result){})
  g.V(government_id).in("isIndividualOf").transform("it.cash-=c.push(it.cash*it.consumption)")
  .then(function(result){})
  g.V(government_id).in("isCorporationOf").transform("it.cash+=c.shift()")
  .then(function(result){console.log(result)})
}

function tax(g,tax_rate){
  g.V(government_id).transform("c=0").then(function(result){})
  g.V(government_id).as("gg").in('isIndividualOf').transform("c+=it.cash*"+tax_rate/100.0).back("gg").transform("it.cash+=c")
  .then(function(result){})
  g.V(government_id).as("gg").in('isIndividualOf').transform("it.cash-=("+tax_rate/100.0+")*it.cash")
  .then(function(result){}) //wealth+income tax
  g.V(government_id).as("gg").in('isIndividualOf').transform("c+=it.consumption*it.wages*"+tax_rate/100.0).back("gg").transform("it.cash+=c")
  .then(function(result){})
  g.V(government_id).as("gg").in('isIndividualOf').transform("it.cash-=("+tax_rate/100.0+")*it.consumption*it.wages")
  .then(function(result){}) //sales tax
  g.V(government_id).as("gg").in('isCorporationOf').transform("c+=it.cash*"+tax_rate/100.0).back("gg").transform("it.cash+=c")
  .then(function(result){})
  g.V(government_id).as("gg").in('isCorporationOf').transform("it.cash-=("+tax_rate/100.0+")*it.cash")
  .then(function(result){}) //business tax
}

function grow(g,tax_rate){ //the idea that lower tax rates allow businesses to invest - and such, grow at some rate
  //mm's GDP growth per year is 3% at 8% tax rate. I assume that it's inversely proportional.
  g.V(government_id).in('isCorporationOf').transform("it.cash+=2.0*(1-"+tax_rate/100.0+")*it.cash")
  .then(function(result){console.log(result)})
}

function add_datum_point(tax_rate){
  return function(result){
    console.log({tax: tax_rate, money: result})
    add_data_point({tax: tax_rate, money: result})
  }
}

function gvt_cash(g, tax_rate){
  var new_fn = add_datum_point(tax_rate)
  g.V(government_id).property("cash").then(new_fn)
}

function step(g, tax_rate){
  pay(g)
  consume(g)
  tax(g,tax_rate)
  grow(g,tax_rate)
}

function do_main(settling_time, tax_rate){
  var newfn = function(g){
    G = g
    for(var i=0;i<settling_time;i++){
      step(G, tax_rate)
    }
    gvt_cash(G, tax_rate)
    graph.shutdown()
  }
  return newfn
}

function acquire_point(tax_rate, settling_time){
  graph = new Helios.GraphDatabase({heliosDBPath: "./helios.js/lib/heliosDB.js"});
  graph.loadGraphSON(mm_graph).then(do_main(settling_time, tax_rate))
}

//Visualizations

function update_graph(new_graph) {
  var color = d3.scale.category20();
  var label_to_group = {individual: 1, corporation: 2, bank: 3, government: 4}
  ngraph = {}
  ngraph.nodes = []
  ngraph.links = []
  for(var i=0;i<new_graph.graph.vertices.length;i++){
    var p_vertex = {}
    p_vertex.name = new_graph.graph.vertices[i].name
    p_vertex.group = label_to_group[new_graph.graph.vertices[i].label]
    ngraph.nodes.push(p_vertex)
  }
  for(var i=0;i<new_graph.graph.edges.length;i++){
    var p_edge = {}
    p_edge.source = new_graph.graph.edges[i]["_outV"]-1
    p_edge.target = new_graph.graph.edges[i]["_inV"]-1
    p_edge.value = (typeof new_graph.graph.edges[i]["weight"] == undefined ? 10.0 : new_graph.graph.edges[i]["weight"])
    ngraph.links.push(p_edge)
  }
  force
  .nodes(ngraph.nodes)
  .links(ngraph.links)
  .start()

  link = svg.selectAll(".link")
  .data(ngraph.links).enter().append("line")
  .attr("class", "link").style("stroke-width", function(d){return 2-Math.sqrt(d.value)})

  node = svg.selectAll(".node")
  .data(ngraph.nodes).enter().append("circle")
  .attr("class", "node").attr("r", 5).style("fill", function(d){return color(d.group)})
  .call(force.drag)

  node.append("title").text(function(d){return d.name})

   force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
}

//Line Graph pls

function init_line_graph(){
  data = [{tax: 0.0, money: 0.0},{tax: 100.0, money: 0.0}]

  line_svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + lgheight + ")")
  .call(xAxis)
  .append("text")
  .attr("x", lgwidth/2)
  .attr("dx", ".71em")
  .attr("dy","1.5em")
  .style("text-anchor", "end")
  .text("Tax Rate (%)")

  line_svg.append("g")
  .attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .style("text-anchor", "end")
  .text("Government Cash (ℳ, Madokami Yen)") //this makes an error in the console but it's fine

  line_svg.append("path")
  .attr("class", "line")
  .attr("d", line(data))
}

//It expects {"tax":8.2, "money":123141.0}

function add_data_point(some_data){
  data.push(some_data)
  data.sort(function(a,b){return a.tax - b.tax})
  line_svg[0][0].children[2].setAttribute("d",line(data))
}

window.onload = function(){
  //Initialize the force-graph visualization
  var fgwidth = 960,
      fgheight = 250;
  var color = d3.scale.category20();
  force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([fgwidth, fgheight]);
  svg = d3.select("body").append("svg")
    .attr("width", fgwidth)
    .attr("height", fgheight);
  update_graph(mm_graph)
  //Initialize the line graph
  var margin = {top: 10, right: 20, bottom: 20, left: 70}
      lgwidth = 960 - margin.left - margin.right,
      lgheight = 350 - margin.top - margin.bottom
  x = d3.scale.linear().domain([0,100]).range([0,lgwidth]) //tax values in %
  y = d3.scale.linear().domain([0,10000000000]).range([lgheight,0]) //cash might be a little.. um.. unbalanced
  xAxis = d3.svg.axis().scale(x).orient("bottom"),
  yAxis = d3.svg.axis().scale(y).orient("left")
  line_svg = d3.select("body").append("svg")
  .attr("width", lgwidth + margin.left + margin.right)
  .attr("height", lgheight + margin.top + margin.bottom)
  .append("g").attr("transform", "translate("+margin.left+","+margin.top+")")
  line = d3.svg.line()
  .x(function(d){return x(d.tax)})
  .y(function(d){return y(d.money)})
  init_line_graph()
}
