// const forgotPasswordLoad = async (req, res) => {
//     try {
//       res.render('forgotPassword');
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
  
//   const sendResetPasswordEmail = async (req, res) => {
//     try {
//       const resetToken = (await randomBytesAsync(32)).toString('hex');
//       const user = await User.findOne({ email: req.body.email });
//       if (!user) {
//         return res.render('forgotPassword', { message: 'User not found' });
//       }
//       user.resetPasswordToken = resetToken;
//       user.resetPasswordExpires = Date.now() + 3600000;
//       await user.save();
//       res.render('forgotPassword', { message: 'Password reset email sent successfully', resetToken });
//     } catch (error) {
//       console.log(error.message);
//       res.render('forgotPassword', { message: 'An error occurred' });
//     }
//   };
  
  
//   const resetPasswordLoad = async (req, res) => {
//     try {
//       const resetToken = req.params.token;
//       res.render('resetPassword', { resetToken: resetToken });
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
  
//   const resetPassword = async (req, res) => {
//     try {
//       const { newPassword, confirmPassword, resetToken } = req.body;
//       console.log('Reset Token:', resetToken);
  
//       const user = await User.findOne({
//         resetPasswordToken: resetToken,
//         resetPasswordExpires: { $gt: Date.now() },
//       });
  
//       if (!user) {
//         return res.render('resetPassword', { message: 'Password reset token is invalid or has expired' });
//       }
  
//       if (newPassword !== confirmPassword) {
//         return res.render('resetPassword', { message: 'Passwords do not match' });
//       }
  
//       const spassword = await securePassword(newPassword);
//       user.password = spassword;
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpires = undefined;
  
//       await user.save();
//       res.redirect('/login');
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
  
// forgotPasswordLoad,
//   sendResetPasswordEmail,
//   resetPasswordLoad,
//   resetPassword,


// user_route.get('/forgotPassword', auth.isLogout, userController.forgotPasswordLoad);
// user_route.post('/forgotPassword', userController.sendResetPasswordEmail);
// user_route.get('/resetPassword/:token', auth.isLogout, userController.resetPasswordLoad);
// user_route.post('/resetPassword', userController.resetPassword);