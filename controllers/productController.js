const Product = require("../models/productsModel");
const Category = require("../models/CategoryModel");
const { default: mongoose } = require("mongoose");
const {
  ItemAssignmentInstance,
} = require("twilio/lib/rest/numbers/v2/regulatoryCompliance/bundle/itemAssignment");

const loadaddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    console.log(categories);
    res.render("addProduct", {
      category: categories,
      user: req.session.user_id ? req.session.user_id : null,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const createProduct = async (req, res) => {
  const { name, description, category, price, stock } = req.body;
  const filesArray = Object.values(req.files).flat();
  const images = filesArray.map((file) => file.filename);
  let categories = await Category.find({}, "category");

  if (name.trim().length === 0 || description.trim().length === 0) {
    res.redirect("/admin/addProduct");
  }

  const newProduct = new Product({
    name,
    description,
    images,
    category,
    price,
    stock,
  });

  newProduct
    .save()
    .then(() => {
      res.redirect("/admin/productsList");
    })
    .catch((err) => {
      console.log("Error adding Product", err);
      res.render("addProduct", {
        message: "Error in adding Product",
        category: categories,
      });
    });
};

const loadProductList = async (req, res) => {
  try {
    const productList = await Product.find();
    // console.log(productList)

    res.render("productsList", { productList: productList });
  } catch (error) {
    console.log(error.message);
  }
};

const editproductLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const productData = await Product.findById({ _id: id });

    const allCategory = await Category.find();

    if (productData) {
      res.render("editProduct", {
        product: productData,
        allCategory: allCategory,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//  const updateProduct=async(req,res)=>{

//             try {

//             const id=req.body.id
//             const updateData=req.body;
//             console.log("updateData",updateData)
//             const filesArray = Object.values(req.files).flat();

//             const newimages = filesArray.map((file) => file.filename);

//             const productData = await Product.findById(id);

//                 if (newimages.length > 0) {

//                 }

//             await Product.findByIdAndUpdate(
//                 id,
//                  updateData,

//                 {new:true}
//             )

//             res.redirect('/admin/productsList')

//             } catch (error) {

//                 console.log(error.message)
//             }

//  }

const updateProduct = async (req, res) => {
  try {
    console.log(req.files, "hi");
    const id = req.query.id;
    console.log(id, "----------------");
    const product = await Product.findById({
      _id: new mongoose.Types.ObjectId(req.query.id),
    }).lean();
    //   console.log(product, 'product');
    //   console.log(req.body.category, "coming to updating");

    //   let categoryId = req.body.category;

    //   if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    //     // Category is passed as a string, find the corresponding category ID
    //     const category = await Category.findOne({ category: categoryId }).lean();
    //     categoryId = category._id;
    //   }

    let updatedProductData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      stock: req.body.stock,
      images: product.images, // Use the previous image data as the starting point
    };
    console.log(updatedProductData, "updatedProductData");
    if (req.files && req.files.length > 0) {
      updatedProductData.images = req.files.map((file) => file.filename); // Update with the new image filenames
    }

    const product1 = await Product.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.query.id) },
      { $set: updatedProductData }
    );
    console.log(product1, "product1");
    res.redirect("/admin/productsList");
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;

    console.log(id);

    const product = await Product.findByIdAndDelete(id);

    res.redirect("/admin/productsList");
  } catch (error) {
    console.log(error.messagae);
  }
};

const unlistProduct = async (req, res) => {
  try {
    id = req.query.id;

    await Product.findByIdAndUpdate({ _id: id }, { $set: { unlist: true } });

    res.redirect("/admin/productsList");
  } catch (error) {
    console.log(error.message);
  }
};

const listedProduct = async (req, res) => {
  try {
    id = req.query.id;

    await Product.findByIdAndUpdate({ _id: id }, { $set: { unlist: false } });

    res.redirect("/admin/productsList");
  } catch (error) {
    error.message;
  }
};

module.exports = {
  createProduct,
  loadaddProduct,
  loadProductList,
  editproductLoad,
  updateProduct,
  deleteProduct,
  unlistProduct,
  listedProduct,
};
