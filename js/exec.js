// ----------------
// init
// ----------------
var FPS = 30;
// Height: 14 + 1/ Width: 7 + 1
var MaxH = 15;
var MaxW = 8;
var CellSize = 16;
var PUYOS_IMG = "puyos.png";
var dx = [1, 0, -1, 0];
var dy = [0, 1, 0, -1];

enchant();

window.onload = function () {
  // -----------------------------
  // メイン処理
  // -----------------------------

  var game = new Game(320, 320);
  game.onload() = function(){
    
    game.fps = FPS;
    // allocate space key to A kbd
    game.keybind(32, 'a');

    var scene = game.rootScene;
    var map = new Map(16, 16);
    var field = new Array(MaxH);
    for (var hi = 0; hi < fireld.length; ++hi) {
      // -1 : 初期値/ 0: 壁 / other: ぷよ
      var tmpArray = [];
      for (var wi = 0; wi < MaxW; wi++) {
        if (0 < wi && wi < MaxW - 1 && hi < MaxH - 1) {
          tmpArray[wi] = -1;
        } else {
          tmpArray[wi] = 0;
        }
      }
      field[hi] = tmpArray;
    }
    // マップにシーンを追加する
    scene.addChild(map);

    // 操作ぷよを宣言
    var cPair = makePair(game, map, field);
    var nPair = makePair(game, map, field);
    var nnPair = makePair(game, map, field);
    scene.addChild(cPair);
    scene.addChild(nPair);
    scene.addChild(nnPair);

    scene.addEventListener("enterframe", function () {
      if (!pair.isFall) {
        // 操作ぷよが着地したら操作ぷよをシーンから削除
        scene.removeChild(cPair);
        scene.removeChild(nPair);
        scene.removeChild(nnPair);
        fallPuyos(field);
        chainPuyos(field);
        map.loadData(field);
        if (field[2][3] != -1) {
          game.stop();
          console.log("Game Over!");
        } else {
          // 操作ぷよを更新
          cPair = nPair;
          nPair = nnPair;
          nnPair = makePair(game, map, field);
          scene.addChild(cPair);
          updatePair(nPair, 1);
          scene.addChild(nPair);
          updatePair(nnPair, 2);
          scene.addChild(nnPair);
        }
      }
    });
    
  };

  game.start();

  // -------------------
  // 関数群
  // -------------------

  // -------------------
  // ぷよ初期化
  // -------------------
  function initPuyo(game) {
    var puyo = new Sprite(CellSize, CellSize);
    puyo.image = game.assets[PUYOS_IMG];
    puyo.frame = Math.floor(Math.random() * 4 + 1);
    puyo.moveTo(0, 0);

    return puyo;
  }

  
  // -------------------
  // ぷよ更新
  // -------------------
  function updatePair(pair, num) {
    switch (num) {
      case 1:
        pair.p0.moveTo(160, CellSize * 3);
        pair.p1.moveTo(160, CellSize * 4);
      break;
      case 2:
        pair.p0.moveTo(160, CellSize * 6);
        pair.p1.moveTo(160, CellSize * 7);
    }
  } 

  // -------------------
  // ぷよ生成
  // -------------------
  function makePair(game, map, field) {
    var pair = new Group();
    // p0: center, p1: around
    var p0 = initPuyo(game);
    var p1 = initPuyo(game);
    var forms = [
	    [0, CellSize], [CellSize, 0], [0, CellSize], [-CellSize, 0]
	];
    var formNum = 0;

    var rCnt = 0;
    var lCnt = 0;
    var cnt = 0;
    pair.isFall = true;
    pair.addChild(p0);
    pair.addChild(p1);
    p1.y = -CellSize;
    pair.moveTo(CellSize * 3, CellSize);
    pair.addEventListener("enterframe", function () {
      // フレームごとの処理
      rCnt += game.input.right ? 1 : 0;
      lCnt += game.input.left ? 1 : 0;
      cnt += game.input.a ? 1 : 0;

      // rotate
      if (cnt === 1) {
        var newFormNum = (formNum + 1) % 4;
        var newmY = forms[newFormNum][0];
        var newmX = forms[newFormNum][1];
        if (!map.hitTest(this.x + newmX, this.y + newmY)) {
          formNum = newFormNum;
          p0.moveTo(newmX, newmY);
        }
      }

      // 横
      var newX = 0;
      if (rCnt === 1) {
        newX = (formNum === 1 ? p1.x + CellSize : p0.x + CellSize);
      }

      if (lCnt === 1) {
        newX = (formNum === 3 ? p1.x - CellSize : p0.x - CellSize);
      }

      if (!map.hitTest(this.x + newX, this.y + p0.y) &&
        !map.hitTest(this.x + newX, this.y + p1.y)) {
        this.x += (newX ? (newX >= 0 ? 1 : -1) : 0) * CellSize;
      }

      // 縦
      var newY = (formNum === 2 ? p1.y + CellSize : p0.y + CellSize);
      var vy = Math.floor(game.input.down ? game.fps / 10 : game.fps / 1);

      if (game.frame % vy) {
        if (!map.hitTest(this.x + p0.x, this.y + newY) &&
          !map.hitTest(this.x + p1.x, this.y + newY)) {
          // 落ちてく
          this.y += CellSize;
        } else {
          field[(this.y + p0.y) / CellSize][(this.x + p0.x) / CellSize] = p0.frame;
          field[(this.y + p1.y) / CellSize][(this.x + p1.x) / CellSize] = p1.frame;
          // 落下
          pair.isFall = false;
        }
      }


    });
    return pair;
  }

  // -------------------------
  // 判定
  // -------------------------
  function countPuyos(hi, wi, field) {
    var color = field[hi][wi];
    var res = 1;
    field[hi][wi] = -1;
    for (var i = 0; i < 4; ++i) {
      var newY = hi + dy[i];
      var newX = wi + dx[i];
      if (!(0 <= newY && newY < MaxH &&
          0 <= newX && newX < MaxW)) continue;
      if (field[newY][newX] == color) {
        res += countPuyos(newY, newX, field);
      }
      if (res >= 4) return 4;
    }
    field[hi][wi] = color;
    return (res >= 4 ? 4 : res);
  }

  // ------------------------
  // ぷよ消す
  // ------------------------
  function erasePuyos(hi, wi, field) {
    var color = field[hi][wi];
    field[hi][wi] = -1;
    for (var i = 0; i < 4; ++i) {
      var newY = hi + dy[i];
      var newX = wi + dx[i];
      if (!(0 <= newY && newY < MaxH &&
          0 <= newX && newX < MaxW)) continue;
      if (field[newY][newX] == color) {
        erasePuyos(newY, newX, field);
      }
    }
  }

  // -----------------------
  // 消えた後の処理
  // -----------------------
  function fallPuyos(field) {
    var res = 0;
    for (var hi = MaxH - 1; hi >= 0; --hi) {
      var spaces = 0;
      for (var wi = 0; wi < MaxW; ++wi) {
        if (field[hi][wi] === -1) ++spaces;
        else if (spaces >= 1) {
          field[hi + spaces][wi] = field[hi][wi];
          field[hi][wi] = -1;
          ++res;
        }
      }
    }
    return res;
  }

  // ----------------------
  // 連鎖処理
  // ----------------------
  function chainPuyos(field) {
    for (var hi = 0; hi < MaxH; ++hi) {
      for (var wi = 0; wi < MaxW; ++wi) {
        // 繋がっているぷよを初期化
        var tmp = 0;
        if (field[hi][wi] > 0 && countPuyos(hi, wi, field) >= 4) {
          erasePuyos(hi, wi, field);
        }
      }
    }
    // 落下するぷよが会った時は、もう一回連鎖処理を行う
    if (fallPuyos(field) >= 1) chainPuyos(field);
  }
  
  // ---------------------
  // キューの実装
  // ---------------------
  function queue() {
    this.__a = new Array();
  }
  
  queue.prototype.enqueue = function(o) {
      this.__a.push(o);
  }
  
  queue.prototype.dequeue = function() {
    if (this.__a.length > 0) return this.__a.shift();
    return null;
  }
  
  queue.prototype.size = function() {
    return this.__a.legth;
  }
  
};