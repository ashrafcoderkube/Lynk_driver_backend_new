const Constant = require("./Constant")
const ENUM = Constant.StatusEnum;


const errorHandler = (err) => {
    console.error("Error at driver route: " + err.message);
    return { status: ENUM.INTERNAL_SERVER_ERROR, message: err.message };
  };
  module .exports={ errorHandler}