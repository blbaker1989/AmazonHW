var mysql = require('mysql');
var inquirer = require('inquirer');
//create connection to db
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "Bamazon_db"
})

function start(){
//prints the items for sale and their details
connection.query('SELECT * FROM Products', function(err, res){
  if(err) throw err;

  console.log('Welcome to Amazon')
  console.log('------------------------------------------------------------------------------------------------')

  for(var i = 0; i<res.length;i++){
    console.log("ID: " + res[i].ItemID + " | " + "Product: " + res[i].ProductName + " | " + "Department: " + res[i].DepartmentName + " | " + "Price: " + res[i].Price + " | " + "QTY: " + res[i].StockQuantity);
    console.log('------------------------------------------------------------------------------------------------')
  }

  console.log(' ');
  inquirer.prompt([
    {
      type: "input",
      name: "id",
      message: "What is the ID of the product you would like to purchase?",
      validate: function(value){
        if(isNaN(value) == false && parseInt(value) <= res.length && parseInt(value) > 0){
          return true;
        } else{
          return false;
        }
      }
    },
    {
      type: "input",
      name: "qty",
      message: "How many would you like to purchase?",
      validate: function(value){
        if(isNaN(value)){
          return false;
        } else{
          return true;
        }
      }
    }
    ]).then(function(ans){
      var itemBought = (ans.id)-1;
      var quantityBought = parseInt(ans.qty);
      var grandTotal = parseFloat(((res[itemBought].Price)*quantityBought).toFixed(2));

      //check if quantity is sufficient
      if(res[itemBought].StockQuantity >= quantityBought){
        //after purchase, updates quantity in Products
        connection.query("UPDATE Products SET ? WHERE ?", [
        {StockQuantity: (res[itemBought].StockQuantity - quantityBought)},
        {ItemID: ans.id}
        ], function(err, result){
            if(err) throw err;
            console.log("Success! Your total is $" + grandTotal.toFixed(2) + ". Your item(s) will be shipped to you with FREE 2-Day shipping because you are an Amazon-Prime member!");
        });

        connection.query("SELECT * FROM Departments", function(err, deptRes){
          if(err) throw err;
          var index;
          for(var i = 0; i < deptRes.length; i++){
            if(deptRes[i].DepartmentName === res[itemBought].DepartmentName){
              index = i;
            }
          }

          //updates totalSales in departments table
          connection.query("UPDATE Departments SET ? WHERE ?", [
          {TotalSales: deptRes[index].TotalSales + grandTotal},
          {DepartmentName: res[itemBought].DepartmentName}
          ], function(err, deptRes){
              if(err) throw err;
              //console.log("Updated Dept Sales.");
          });
        });

      } else{
        console.log("Sorry, there's not enough in stock!");
      }

      reprompt();
    })
})
}

//asks if they would like to purchase another item
function reprompt(){
  inquirer.prompt([{
    type: "confirm",
    name: "reply",
    message: "Would you like to purchase another item?"
  }]).then(function(ans){
    if(ans.reply){
      start();
    } else{
      console.log("Hope to see you again soon!");
    }
  });
}

start();
