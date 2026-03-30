const Membership = require('../Modals/membership');
const auth = require('../Auth/auth');   

exports.addMembership = async (req, res)=>{
    try {
        const {months, price}=req.body;
        const memberShip = await  Membership.findOne({gym:req.gym._id, months});
        if (memberShip){
            memberShip.price = price;
            await memberShip.save();
            res.status(200).json({message:"Updated Sucessfully"});
        }else{
            const newMembership = new Membership({price,months, gym:req.gym._id});
            await newMembership.save();
            res.status(200).json({
                message:"Added Sucessfully",
                data: newMembership
            });
        }

    } catch (error) {
        res.status(500).json({error: "Server Error"});
    }
}

exports.getmembership=async(req,res)=>{
    try {
        const loggedInId = req.gym._id;
        console.log("loggedInId : " + loggedInId);
        const memberShip  = await Membership.find({gym:loggedInId});
        // const memberShip  = await Membership.find({});
        res.status(200).json({
            message: "Membership Fetched Successfully",
            membership: memberShip
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Server Error"
            });
    }
}