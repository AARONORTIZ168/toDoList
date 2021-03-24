const express = require("express");
const _ = require("lodash");
const https = require("https");
const app = express();
const mongoose = require("mongoose");
const quotesURL = "https://api.quotable.io/random";

//configs
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

//connect to MongoDB
mongoose.connect("mongodb://localhost:27017/todolistDB");

//Define a schema for documents
const itemSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

//create a model
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Yujuuuu there's nothing to do",
});

let defaultItems = [item1];

/* Item.deleteMany(function(err){
    if(err){
        console.log(err);
    } else {
        console.log("Borrado");
    }
}); */

//renderize the homepage
app.get("/", function (req, res) {
  //renderize list in homepage
  Item.find({}, function (err, result) {
    //if there isn't any item, render one by default
    if (result.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Todo piola");
        }
      });
      //refresh page
      res.redirect("/");
    } else {
      //get the random quote and render it with all
      https.get(quotesURL, function (response) {
        response.on("data", function (data) {
          const quotesData = JSON.parse(data);
          const quote = quotesData.content;
          const author = quotesData.author;

          //render everything
          res.render("list", {
            listTitle: "2day",
            newListItems: result,
            quoteP: quote,
            authorP: author,
          });
        });
      });
    }
  });
});

//post new item
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "2day") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//remove items of an list
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  //check if list name items is home list and delete items
  if (listName == "2day") {
    Item.findOneAndRemove(
      { _id: checkedItemId },
      { useFindAndModify: false },
      function (err) {
        if (!err) {
          console.log(checkedItemId + " fue borrada");
          res.redirect("/");
        } else {
          console.log(err);
        }
      }
    );
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function(err, foundList){
        if(!err){
            res.redirect("/" + listName);
        }
      }
    );
  }
});

//alternative routes
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //get random quote
        https.get(quotesURL, function (response) {
          response.on("data", function (data) {
            const quotesData = JSON.parse(data);
            const quote = quotesData.content;
            const author = quotesData.author;

            //render everything
            res.render("list", {
              listTitle: foundList.name,
              newListItems: foundList.items,
              quoteP: quote,
              authorP: author,
            });
          });
        });
      }
    }
  });
});

app.post("/work", function (req, res) {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

app.listen(3000, function () {
  console.log("Server started");
});
