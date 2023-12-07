const mongoclient = require("mongodb").MongoClient;
const ObjId = require('mongodb').ObjectId;
const url =
    'mongodb+srv://admin:1234@cluster0.upryxh2.mongodb.net/?retryWrites=true&w=majority';
let mydb;
mongoclient.connect(url)
    .then((client) => {
        mydb = client.db("myboard");
    })


const express = require('express');
const app = express();
const sha = require('sha256');

let session = require('express-session');
app.use(session({
    secret: 'dkufe8938493j4e08349u',
    resave: false,
    saveUninitialized: true
}))

app.use(express.static('public'));

// body parser 추가
const bodyParser = require('body-parser');
const { render } = require("ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.listen(8080, function () {
    console.log("포트 8080으로 서버 대기중 ... ")
});


app.get('/entermongo', function (req, res) {
    if (req.session.user) { // 로그인 중 
        console.log('세션 유지');
        res.render('enter.ejs'); // 블로그 글쓰기 창 띄우기 
    } else { // 로그인 상태 아님 
        res.render('login.ejs'); // 로그인 화면 띄우기 
    }
});

app.post('/savemongo', function (req, res) {
    console.log(req.session.user);
    console.log(req.body.title);
    console.log(req.body.content);

    let now = new Date(); // Date() 객체 생성 
    let isoDateString = now.toISOString();
    let yearMonthDay = isoDateString.substring(0, 10);

    mydb.collection('post').insertOne( // post 컬렉션에 유저 아이디, 제목, 내용, 작성일 데이터를 삽입 
        { userid: req.session.user.userid, title: req.body.title, content: req.body.content, date: yearMonthDay })
        .then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
        });
    res.redirect('/listmongo'); // 블로그 글 작성 이후 전체 블로그 창으로 이동 
});

app.get('/', function (req, res) {
    res.redirect('/login');
});



app.get("/listmongo", function (req, res) {
    if (req.session.user) { // 로그인 중 
        console.log('세션 유지');
        mydb.collection("post") // post 컬렉션에 접근 
            .find()
            .toArray()
            .then((result) => { // post 컬렉션에 있는 데이터를 result에 저장 
                console.log(result);
                res.render('list_mongo.ejs', { data: result, currentUser: req.session.user }); // list_mongo.ejs 에 정보 전달 
            });
    } else { // 로그인 상태 아님 
        res.render('login.ejs'); 
    }
});

app.get("/content/:id", function (req, res) {
    console.log(req.params.id);

    let new_id = new ObjId(req.params.id);
    if (req.session.user) { //  로그인 중 
        console.log('세션 유지');
        mydb.collection("post")
            .findOne({ _id: new_id }) // _id가 일치하는 값을 찾기 위해 findOne() 함수 사용 
            .then(result => {
                console.log(result);


                const currentUser = req.session.user; // 유저 정보 저장 

                // 작성자와 현재 로그인한 사용자의 아이디가 일치하면 수정 버튼을 표시
                const isCurrentUserAuthor = currentUser && result.userid === currentUser.userid;

                res.render('content.ejs', { data: result, isCurrentUserAuthor }); // 결과값을 content.ejs 로 전달 
            }).catch(err => { // 오류 발생 
                console.log(err);
                res.status(500).send();
            });

    } else { // 로그인 상태 아님 
        res.render('login.ejs');
    }
});


app.get("/edit/:id", function (req, res) {
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);

    if (req.session.user) { // 로그인 중 
        console.log('세션 유지');
        mydb.collection("post") 
            .findOne({ _id: new_id }) // _id가 일치하는 값을 찾기 위해 findOne() 함수 사용 
            .then(result => {
                console.log(result);
                res.render('edit.ejs', { data: result }); // 결과값을 edit.ejs 로 전달 
            }).catch(err => { // 오류 발생 
                console.log(err);
                res.status(500).send();
            });
    } else { // 로그인 상태 아님 
        res.render('login.ejs');
    }
});


app.post("/delete", function (req, res) {
    console.log(req.body);
    req.body._id = new ObjId(req.body._id);
    mydb.collection('post').deleteOne(req.body) // post 컬렉션에 있는 데이터를 삭제한다. 
        .then(result => { // 삭제 성공 
            console.log('삭제완료'); 
            res.status(200).send();
        })
        .catch(err => { // 삭제 실패 
            console.log(err);
            res.status(500).send();
        });
});

app.post('/edit', function (req, res) {
    console.log(req.body.title);
    console.log(req.body.content);

    let now = new Date(); // 시간을 새로 수정한다. 
    let isoDateString = now.toISOString();
    let yearMonthDay = isoDateString.substring(0, 10);

    let new_id = new ObjId(req.body.id);
    mydb.collection('post').updateOne({ _id: new_id }, // 몽고 DB 데이터를 수정하기 위해서 updateOne() 함수를 사용 
        { $set: { title: req.body.title, content: req.body.content, date: yearMonthDay } }) // $set 연산자를 통해 수정할 값을 업데이트 한다. 
        .then(result => { // 성공 
            console.log('데이터 수정 성공');
            res.redirect('/listmongo'); // 전체 블로그 창으로 이동 
        });
});

app.get("/login", function (req, res) {
    console.log(req.session);
    if (req.session.user) { // 로그인 성공
        console.log('세션 유지');
        res.render('index.ejs', { user: req.session.user });
    } else { // 로그인 실패 
        res.render("login.ejs");
    }
});

app.post("/login", function (req, res) {
    console.log("아이디 : " + req.body.userid);
    console.log("비밀번호 : " + req.body.userpw);

    mydb
        .collection("account") // account 컬렉션에 접근 
        .findOne({ userid: req.body.userid }) // req.body.userid와 일치하는 도규먼트가 있는지 검색 
        .then((result) => { // userid가 일치하는 도규먼트가 있다면 해당 항목의 데이터를 result에 넘겨준다 
            if (result.userpw == sha(req.body.userpw)) { // 로그인 성공 (입력한 비밀번호(암호화)와 mongodb에 입력된 비밀번호(암호화)가 같을 때 )
                req.session.user = req.body;
                console.log('새로운 로그인');
                res.render('index.ejs', { user: req.session.user }); 
            } else { // 로그인 실패
                res.render('login.ejs');
            }
        })
        .catch((error) => { // 예상치 못한 오류
            console.error("Error during login:", error);
            res.render('login.ejs');
        });
});

app.get("/logout", function (req, res) {
    console.log("로그아웃");
    req.session.destroy(); // 현재 도메인의 세션을 삭제 
    res.render('login.ejs', { user: null }); // 로그인 창으로 이동 
});

app.get("/signup", function (req, res) { 
    res.render("signup.ejs"); // signup.ejs 파일을 띄운다 
});

app.post("/signup", function (req, res) {
    console.log(req.body.userid);
    console.log(sha(req.body.userpw));
    console.log(req.body.usergroup);
    console.log(req.body.useremail);

    mydb
        .collection("account") // 회원가입 정보를 저장 
        .insertOne({
            userid: req.body.userid,
            userpw: sha(req.body.userpw), // 비밀번호는 암호화 하여 저장한다. 
            usergroup: req.body.usergroup,
            useremail: req.body.useremail,
        })
        .then((result) => { // 회원가입 성공
            console.log("회원가입 성공");
        });

    res.redirect("/login"); // 로그인 화면으로 이동 
});

app.get('/search', function (req, res) {
    console.log(req.query);

    if (req.session.user) { // 로그인 중 
        console.log('세션 유지');
        mydb
            .collection("post") // post 컬렉션에 접근 
            .find({ title: req.query.value }).toArray() 
            // find() 함수로 제목을 입력한 검색어인 req.query.value의 값을 검색 , 검색 결과가 여려개 이므로 toArray() 함수로 체이닝한다
            .then((result) => { 
                console.log(result); 
                res.render('sresult.ejs', { data: result, currentUser: req.session.user }); // 결과를 sresult.ejs 파일로 보낸다 
            })

    } else { // 로그인 안됨
        res.render('login.ejs');
    }
});