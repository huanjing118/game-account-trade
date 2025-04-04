// 初始化Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAUIqrgmYdzcXrYaVqy3Pt6Q1-T97oeV-k",
  authDomain: "game-account-trade.firebaseapp.com",
  projectId: "game-account-trade",
  storageBucket: "game-account-trade.firebasestorage.app",
  messagingSenderId: "72288630382",
  appId: "1:72288630382:web:ec872878163c8d9d5b187f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 监听用户登录状态
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("用户已登录:", user.email);
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("register-btn").style.display = "none";
    } else {
        console.log("用户未登录");
    }
});

// 注册功能
document.getElementById("register-btn").addEventListener("click", () => {
    const email = prompt("请输入邮箱");
    const password = prompt("请输入密码");
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("注册成功！"))
        .catch(error => alert("注册失败：" + error.message));
});

// 登录功能
document.getElementById("login-btn").addEventListener("click", () => {
    const email = prompt("请输入邮箱");
    const password = prompt("请输入密码");
    auth.signInWithEmailAndPassword(email, password)
        .then(() => alert("登录成功！"))
        .catch(error => alert("登录失败：" + error.message));
});

// 加载账号列表
function loadAccounts() {
    db.collection("accounts").get().then(snapshot => {
        const accountList = document.getElementById("account-list");
        accountList.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            accountList.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>${data.game}</h5>
                            <p>${data.description}</p>
                            <p>价格: ¥${data.price}</p>
                            <button class="btn btn-sm btn-primary buy-btn">购买</button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// 提交出售表单
document.getElementById("sell-form").addEventListener("submit", e => {
    e.preventDefault();
    const inputs = e.target.elements;
    db.collection("accounts").add({
        game: inputs[0].value,
        description: inputs[1].value,
        price: inputs[2].value,
        seller: auth.currentUser?.email || "匿名",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("账号已提交出售！");
        loadAccounts();
    });
});

// 提交客服问题
document.getElementById("submit-question").addEventListener("click", () => {
    const question = document.getElementById("question").value;
    if (!question) return alert("请输入问题");
    db.collection("support").add({
        question,
        user: auth.currentUser?.email || "匿名",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => alert("问题已提交！"));
});

// 初始化页面
loadAccounts();