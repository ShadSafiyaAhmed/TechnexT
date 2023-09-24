const Category = require("../models/CategoryModel");

//Load Category

const LoadCategory = async (req, res) => {
  try {
    const category = await Category.find();

    res.render("addCategory", { categories: category });
  } catch (error) {
    console.log(error.message);
  }
};

//addCategory

const addCategory = async (req, res) => {
  try {
    const { category, description } = req.body;

    const existingCategory = await Category.findOne({
      category: { $regex: new RegExp(`^${category}$`, "i") },
    });

    if (existingCategory) {
      res.redirect("addCategory", { message: "Category already Exist" });
    } else {
      const newCategory = new Category({
        category: category,
        description: description,
      });

      await newCategory.save();
      
      res.redirect("/admin/addCategory");
    }
  } catch (error) {
    console.log(error.message);
    return res.redirect("/admin/addCategory");
  }
};

const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;

    await Category.findByIdAndUpdate({ _id: id }, { $set: { unlist: true } });

    res.redirect("/admin/addCategory");
  } catch (error) {
    console.log(error.messsage);
  }
};
const listCategory = async (req, res) => {
  try {
    const id = req.query.id;

    // console.log(id)
    await Category.findByIdAndUpdate({ _id: id }, { $set: { unlist: false } });

    res.redirect("/admin/addCategory");
  } catch (error) {
    console.log(error.messsage);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const category = await Category.findByIdAndDelete(id);

    res.redirect("/admin/addCategory");
  } catch (error) {
    console.log(error.message);
  }
};

const Catlist = async (req, res) => {
  try {
    const CategoryId = req.query.id;

    //  const CatData= await Category.findById({_id:CategoryId})

    //  console.log(CatData)
  } catch (error) {
    console.log(error.message);
  }
};

const editCategoryLoad=async(req,res)=>{

  try {

    console.log("ivideeeeeee")
    const id = req.query.id;
    console.log(id)

    const categoryData = await Category.findById({ _id: id });
    console.log(categoryData)
    if(categoryData){

      res.render('editCategory',{categoryData:categoryData})
    }

  
  } catch (error) {
    console.log(error.message)
  }
}


 const updateCategory=async(req,res)=>{

            try {

            const id=req.body.id
            const updateData=req.body;
            console.log("updateData",updateData)
          

           await Category.findByIdAndUpdate(
                id,
                 updateData,

                {new:true}
            )
           
            res.redirect('/admin/addCategory')

            } catch (error) {

                console.log(error.message)
            }

 }

module.exports = {
  LoadCategory,  
  addCategory,
  unlistCategory,
  listCategory,
  Catlist,
  deleteCategory,
  editCategoryLoad,
  updateCategory
};
