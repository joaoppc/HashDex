import './App.css'; 
import React, {Component} from 'react';
import { createChart } from 'lightweight-charts';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";






class App extends Component{
   constructor(props){
    super(props);
    this.sym='btcusdt';
    this.state = {
      selectValue: localStorage.getItem('selected'),
    };

    this.handleChange = this.handleChange.bind(this);
    

  }  
  
  componentDidMount(){

    
    if (this.state.selectValue !== null){
      this.sym = this.state.selectValue.toLowerCase()+'usdt'
    }
    
    const socketTrade = new WebSocket("wss://stream.binance.com:9443/ws/"+this.sym+"@trade");
    const myRequest = new Request('https://api.hashdex.io/prod/marketdata/v1/index/HDAI/last');
    const socketOrder = new WebSocket("wss://stream.binance.com:9443/ws/"+this.sym+"@depth10");
    
    

    
    
    

    /////Asset constituent/////
    fetch(myRequest).then(response=>response.json()).then(json=>{
      for(var x=0;x<json['constituents'].length;x++){
      document.getElementById('lista').innerHTML += json['constituents'][x]['assetId']+':    '+json['constituents'][x]['currentPrice']+"<br>";
      document.getElementById('asset').innerHTML +="<option value="+json['constituents'][x]['assetId']+'>'+json['constituents'][x]['assetId']+'</option>'

      }  
      
      
    });
    
    const chartO = createChart(document.getElementById('chart'), { width: 1800, height: 400 });
    const lineSeries = chartO.addLineSeries();
    socketTrade.onmessage = function (event) {
      var object = JSON.parse(event.data);
      console.log(object)
      ///////////price chart///////////////////
      lineSeries.update({
        time: object.t,
        value: object.p
      }); 
      ////////////////////////////////////////
      
    }


    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var chart = am4core.create("orderChart", am4charts.XYChart);
    

    // Add data
    chart.dataSource.url = "https://poloniex.com/public?command=returnOrderBook&currencyPair=USDT_"+this.state.selectValue+"&depth=50";
    chart.dataSource.reloadFrequency = 30000;
    chart.dataSource.adapter.add("parsedData", function(data) {
      
      // Function to process (sort and calculate cummulative volume)
      function processData(list, type, desc) {

        // Convert to data points
        for(var i = 0; i < list.length; i++) {
          list[i] = {
            value: Number(list[i][0]),
            volume: Number(list[i][1]),
          }
        }

        // Sort list just in case
        list.sort(function(a, b) {
          if (a.value > b.value) {
            return 1;
          }
          else if (a.value < b.value) {
            return -1;
          }
          else {
            return 0;
          }
        });

        // Calculate cummulative volume
        if (desc) {
          for(var i = list.length - 1; i >= 0; i--) {
            if (i < (list.length - 1)) {
              list[i].totalvolume = list[i+1].totalvolume + list[i].volume;
            }
            else {
              list[i].totalvolume = list[i].volume;
            }
            var dp = {};
            dp["value"] = list[i].value;
            dp[type + "volume"] = list[i].volume;
            dp[type + "totalvolume"] = list[i].totalvolume;
            res.unshift(dp);
          }
        }
        else {
          for(var i = 0; i < list.length; i++) {
            if (i > 0) {
              list[i].totalvolume = list[i-1].totalvolume + list[i].volume;
            }
            else {
              list[i].totalvolume = list[i].volume;
            }
            var dp = {};
            dp["value"] = list[i].value;
            dp[type + "volume"] = list[i].volume;
            dp[type + "totalvolume"] = list[i].totalvolume;
            res.push(dp);
          }
        }

      }

      // Init
      var res = [];
      processData(data.bids, "bids", true);
      processData(data.asks, "asks", false);

      return res;
    });

    // Set up precision for numbers
    chart.numberFormatter.numberFormat = "#,###.####";

    // Create axes
    var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = "value";
    //xAxis.renderer.grid.template.location = 0;
    xAxis.renderer.minGridDistance = 100;
    xAxis.title.text = this.state.selectValue.toUpperCase()+"/USDT";

    var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.title.text = "Volume";

    // Create series
    var series = chart.series.push(new am4charts.StepLineSeries());
    series.dataFields.categoryX = "value";
    series.dataFields.valueY = "bidstotalvolume";
    series.strokeWidth = 2;
    series.stroke = am4core.color("#0f0");
    series.fill = series.stroke;
    series.fillOpacity = 0.1;
    series.tooltipText = "Ask: [bold]{categoryX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{bidsvolume}[/]"

    var series2 = chart.series.push(new am4charts.StepLineSeries());
    series2.dataFields.categoryX = "value";
    series2.dataFields.valueY = "askstotalvolume";
    series2.strokeWidth = 2;
    series2.stroke = am4core.color("#f00");
    series2.fill = series2.stroke;
    series2.fillOpacity = 0.1;
    series2.tooltipText = "Ask: [bold]{categoryX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{asksvolume}[/]"

    var series3 = chart.series.push(new am4charts.ColumnSeries());
    series3.dataFields.categoryX = "value";
    series3.dataFields.valueY = "bidsvolume";
    series3.strokeWidth = 0;
    series3.fill = am4core.color("#000");
    series3.fillOpacity = 0.2;

    var series4 = chart.series.push(new am4charts.ColumnSeries());
    series4.dataFields.categoryX = "value";
    series4.dataFields.valueY = "asksvolume";
    series4.strokeWidth = 0;
    series4.fill = am4core.color("#000");
    series4.fillOpacity = 0.2;

    // Add cursor
    chart.cursor = new am4charts.XYCursor(); 



////////////////////////////////////////////////////////////////////////////////////////

    var buy = document.getElementById('buy');
    var sell = document.getElementById('sell');
    socketOrder.onmessage = function (event) {
      buy.innerHTML = 'Buy<br>';
      sell.innerHTML = 'Sell<br>';
      var order = JSON.parse(event.data);
      console.log(order)

      for (let i = 0; i < 10; i++) {
        buy.innerHTML +="Price: "+ order.bids[i][0]+"          Volume: "+order.bids[i][1]+"<br>";
        sell.innerHTML +="Price: "+ order.asks[i][0]+"          Volume: "+order.asks[i][1]+"<br>";
      }
     
    }
    socketOrder.onopen = function(event){
      console.log(event);
    }
    socketOrder.onerror = function (event) {
      console.log(event.data);
   };
   socketOrder.onclose = function(event) {
    if (event.code === 1000) {
      console.log('WebSocket closed normally');
    } else {
        console.log('WebSocket closed unexpectedly: ' + event.code);
    }
  }
   

  }


  
  handleChange(e) {
    console.log("Asset selected");
    this.setState({ selectValue: e.target.value });
    localStorage.setItem('selected', e.target.value)
    window.location.reload();
  }
  render() {
    return(
      <div className="App">
      <h2>
        HashDex Dashboard
      </h2>
      <div>
      {localStorage.getItem('selected')}
        <select id = 'asset' onChange={this.handleChange}>
          <option>Select</option>  

        </select>
      </div>
      <div id='lista' className='App-lista'>
      </div>
      <div id ='order' className ='App-order'>
        Asset:{localStorage.getItem('selected')}
        <div id = 'buy' ></div>
        <div id = 'sell'></div>
        
      </div>
      <div className='App-chart' id='chart'>

      </div>
      <div id = 'orderChart' className='App-orderchart'>
        
      </div>
      
    </div>

    );
  }
}





export default App;
