const multer = require("multer");
const path = require("path");

const UserImageStorage=multer.diskStorage({

    destination:function(req,file,cb){
        {
            cb(null,path.join(__dirname,'../public/userImages'));
        }
    },
    filename:function(req,file,cb){
  
        const name=Date.now()+'-'+file.originalname;
  
        cb(null,name)
    }
  });

  const storage= multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/productImages"));
    },
    
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });

  const bannerImageStorage=multer.diskStorage({

    destination:function(req,file,cb){
        {
            cb(null,path.join(__dirname,'../public/BannerImages'));
        }
    },
    filename:function(req,file,cb){
  
        const name=Date.now()+'-'+file.originalname;
  
        cb(null,name)
    }
  });


module.exports={

  upload: multer({storage: storage }).array("file"),

 
    uploadUserImage:multer({storage:UserImageStorage}),
    
    uploadBnannerImage:multer({storage:bannerImageStorage})
}