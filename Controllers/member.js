const Member = require('../Modals/member');
const Membership = require('../Modals/membership');


exports.getAllMember = async (req, res) => {
    try {

        const { skip, limit } = req.query;
        const members = await Member.find({ gym: req.gym._id });
        const totalMember = members.length;
        const limitedMembers = await Member.find({ gym: req.gym._id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.status(200).json({
            message: members.length ? "Fetched Members Successfully" : "No any Member Registered yet",
            members: limitedMembers,
            totalMembers: totalMember
        })

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
}

function addMonthsToDate(months, joiningDate) {

    //Get current year, month, and day
    let today = joiningDate;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); //Months are 0-indexed
    const currentDay = today.getDate();


    //Calculate the new month and year
    const futureMonth = currentMonth + months;
    const futureYear = currentYear + Math.floor(futureMonth / 12);



    //Calculate the correct future month (modulus for month)
    const adjustedMonth = futureMonth % 12;

    //Set the date to the first of the future month
    const futureDate = new Date(futureYear, adjustedMonth, 1);

    //Get the last day of the future month
    const lastDayOfFutureMonth = new Date(futureYear, adjustedMonth + 1, 0).getDate();

    //Adjust the day if current day exceeds the number of days in the new month
    const adjustedDay = Math.min(currentDay, lastDayOfFutureMonth);

    //Set the final adjusted day
    futureDate.setDate(adjustedDay);
    return futureDate;


}

exports.registerMember = async (req, res) => {
    try {

        const { name, mobileNo, address, membership, profilePic, joiningDate } = req.body;
        const member = await Member.findOne({ gym: req.gym._id, mobileNo });

        if (member) {
            return res.status(409).json({ error: "Already registered with this Mobile No" })
        }

        const memberShip = await Membership.findOne({ _id: membership, gym: req.gym._id });

        const membershipMonth = memberShip.months;

        if (memberShip) {

            let jngDate = new Date(joiningDate);

            const nextBillDate = addMonthsToDate(membershipMonth, jngDate);

            let newmember = new Member({ name, mobileNo, address, membership, gym: req.gym._id, profilePic, lastPayment: jngDate, nextBillDate });
            await newmember.save();
            res.status(200).json({ message: "Member Registered successfully", newmember })

        } else {
            return res.status(409).json({ error: "No Such Membership are there" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.searchMember = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        const member = await Member.find({
            gym: req.gym._id,
            $or: [{ name: { $regex: '^' + searchTerm, $options: 'i' } },
            { mobileNo: { $regex: '^' + searchTerm, $options: 'i' } }
            ]
        });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member Registered yet",
            members: member,
            totalMembers: member.length
        })



    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.monthlyMember = async (req, res) => {
    try {
        const now = new Date();
        //Get the first day of the current month (e.g : 2025/11/30 00:00:00)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        //Get the last day of the current month (e.g : 2024/09/30 23:59:59)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const member = await Member.find({
            gym: req.gym._id,
            createdAt: {
                $gte: startOfMonth, //Greater than or equal to the first day of the month
                $lte: endOfMonth // Less than or equal to the last day of the month
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member Registered yet",
            members: member,
            totalMembers: member.length
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.expiringWithin3Days = async (req, res) => {
    try {
        const today = new Date();
        const nextThreeDays = new Date();
        nextThreeDays.setDate(today.getDate() + 3);

        const member = await Member.find({
            gym: req.gym._id,
            nextBillDate: {
                $gte: today, //Greater than or equal to the first day of the month
                $lte: nextThreeDays // Less than or equal to the last day of the month
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member is Expiring within 3 Days",
            members: member,
            totalMembers: member.length
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.expiringWithin4To7Days = async (req, res) => {
    try {
        const today = new Date();
        const next4Days = new Date();
        next4Days.setDate(today.getDate() + 4);

        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const member = await Member.find({
            gym: req.gym._id,
            nextBillDate: {
                $gte: next4Days, //Greater than or equal to 4 days later from today
                $lte: next7Days // Less than or equal to 7 days from today
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member is Expiring within 4-7 Days",
            members: member,
            totalMembers: member.length
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.expiredMember = async (req, res) => {
    try {
        const today = new Date();

        const member = await Member.find({
            gym: req.gym._id, status: "Active",
            nextBillDate: {
                $lt: today // Less than from today
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member has been expired",
            members: member,
            totalMembers: member.length
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}


exports.inActiveMember = async (req, res) => {
    try {
        const today = new Date();

        const member = await Member.find({
            gym: req.gym._id, status: "Pending"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: member.length ? "Fetched Members Successfully" : "No Such Member is Pending",
            members: member,
            totalMembers: member.length
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.getMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findOne({ _id: id, gym: req.gym._id });
        if (!member) {
            return res.status(400).json({
                error: "No Such Member"
            });
        }
        res.status(200).json({
            message: "Member Data fetched",
            member: member
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const member = await Member.findOne({ _id: id, gym: req.gym._id });
        if (!member) {
            return res.status(400).json({
                error: "No Such Member"
            });
        }

        member.status = status;
        await member.save();

        res.status(200).json({
            message: "Status changed successfully",
            member: member
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}

exports.updateMemberPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { membership } = req.body;

        const memberShip = await Membership.findOne({ gym: req.gym._id, _id: membership });
        if (memberShip) {
            let getMonth = memberShip.months;
            let today = new Date();
            const nextBillDate = addMonthsToDate(getMonth, today);
            const member = await Member.findOne({ _id: id, gym: req.gym._id });
            if (!member) {
                return res.status(400).json({
                    error: "No Such Member are there"
                });
            }
            member.nextBillDate = nextBillDate;
            member.lastPayment = today;
            member.membership = membership;
            await member.save();

            res.status(200).json({
                message: "Member Renewed Successfully",
                member: member
            })

        } else {
            return res.status(409).json({ error: "No Such Membership are there" })
        }



    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error" });
    }
}