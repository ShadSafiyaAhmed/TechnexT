const User = require("../models/userModel");
const wishListModel = require("../models/wishListModel");
const wishListHelper = require("../helpers/wishListHelper");
const { ObjectId } = require("mongodb");

const loadWishList = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const userData = await User.findById({ _id: req.session.user_id });
    const wishlistCount = await wishListHelper.getWishListCount(userId);

    const wishListProduct = await wishListHelper.getWishListProducts(userId);

    res.render("wishList", { user: userData, wishListProduct, wishlistCount });
  } catch (error) {
    console.log(error.message);
  }
};

const addWishList = async (req, res) => {
  try {
    console.log("add to wish listtt");
    let proId = req.body.proId;
    let userId = req.session.user_id;

    let userWishList = await wishListModel.findOne({
      user: new ObjectId(userId),
    });

    if (userWishList) {
      let productExist = userWishList.wishList.findIndex(
        (wishList) => wishList.productId == proId
      );

      if (productExist != -1) {
        res.send({ status: false });
      } else {
        await wishListModel.updateOne(
          { user: new ObjectId(userId) },
          {
            $push: {
              wishList: { productId: new ObjectId(proId) },
            },
          }
        );
        res.send({ status: true });
      }
    } else {
      let wishListData = {
        user: new ObjectId(userId),
        wishList: [{ productId: new ObjectId(proId) }],
      };
      let newWishList = new wishListModel(wishListData);
      await newWishList.save();
      res.send({ status: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: error.message });
  }
};

const removeProductWishlist = async (req, res) => {

  const userId = req.session.user_id;

  const proId = req.body.proId;

  wishListHelper.removeProductWishlist(proId, userId).then((response) => {
    res.send(response);
  });
};

module.exports = {
  loadWishList,
  addWishList,
  removeProductWishlist,
};
