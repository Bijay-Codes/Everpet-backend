import everpet from "./app.js";

const PORT = process.env.PORT || 3000;

everpet.listen(PORT, () => {
    console.log(`Everpet-backend is running at port \n http://localhost:${PORT}`);
});
