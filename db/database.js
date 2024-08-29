exports.connectDatabase = () => {
    const mongoose = require("mongoose");
    // mongodb+srv://AshutoshLakshakar:Ashutosh@atlascluster.u4nwzhk.mongodb.net/Chat?retryWrites=true&w=majority&appName=AtlasCluster
    mongoose.connect(`mongodb+srv://AshutoshLakshakar:Ashutosh@atlascluster.u4nwzhk.mongodb.net/Chat?retryWrites=true&w=majority&appName=AtlasCluster`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    ).then(() => {
        console.log('database connected successfully');
    });
}
