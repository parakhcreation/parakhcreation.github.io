import {
    db
} from "./firebase.js";

import {
    collection,
    doc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vSoOi31SJkVFXK7OCiqavDorxm9lw_iK4WeY1PLviq5sM5yt61P9kHWjxIqLgtc66jgQP3O1FQ2Mfqf/pub?output=csv";

const status =
document.getElementById("status");

document.getElementById("importBtn").onclick =
async ()=>{

status.textContent="Reading Google Sheet...";

Papa.parse(CSV_URL,{

download:true,

header:true,

skipEmptyLines:true,

complete:async(result)=>{

const products=result.data;

let count=0;

for(const product of products){

const id=(product.id || "").trim();

if(!id) continue;

await setDoc(

doc(db,"products",id),

{

...product,

price:Number(product.price),

updatedAt:new Date()

},

{merge:true}

);

count++;

status.textContent=
`Imported ${count} products...`;

}

status.innerHTML=
`✅ Successfully imported ${count} products`;

}

});

};
