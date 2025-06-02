import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

//const socket = io("https://server-yflm.onrender.com");

const socket = io("http://localhost:3001");

const allRoles = ["a", "b", "c", "d", "e","admin"];


function App() {
  const [maze, setMaze] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [position, setPosition] = useState({ x: 1, y: 1 });
  const [yPositions, setYPositions] = useState([]);
  const [gameClear, setGameClear] = useState(false);
  const [mazeIndex, setMazeIndex] = useState(0);

  useEffect(() => {

    window.focus(); // 포커스를 강제로 주는 코드

    socket.on("init-maze", (mazeData) => {
      setMaze(mazeData);
    });

    socket.on("game-state", (state) => {
      setPosition(state.playerPosition);
      setYPositions(state.yPositions || []);
      setMaze(state.maze);
      setMazeIndex(state.mazeIndex);  // ✅ 단계 상태 저장
    });

    socket.on("game-clear", () => {
      setGameClear(true);
    });

    socket.on("role-assigned", (role) => {
      setSelectedRole(role);
    });

    socket.on("role-taken", (role) => {
      alert(`❌ 역할 ${role.toUpperCase()}는 이미 선택됐어요!`);
    });

    

    return () => {
      socket.off("init-maze");
      socket.off("game-state");
      socket.off("game-clear");
      socket.off("role-assigned");
      socket.off("role-taken");
    };
  }, []);

// 맵 테스트용 'a' 키보드 입력력
  useEffect(() => {
  const handleKeyDown = (e) => {
    if (selectedRole !== "a") return;

    let direction = null;
    switch (e.key) {
      case "ArrowUp":
        direction = "up";
        break;
      case "ArrowDown":
        direction = "down";
        break;
      case "ArrowLeft":
        direction = "left";
        break;
      case "ArrowRight":
        direction = "right";
        break;
      default:
        return;
    }

    socket.emit("move", { direction });
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
  }, [selectedRole]);

  const handleSelectRole = (role) => {
    socket.emit("join-as", role);
  };

  const handleMove = (direction) => {
    socket.emit("move", { direction });
  };

  const resetRole = () => {
    socket.emit("leave-role", selectedRole);
    setSelectedRole(null);
  };

  if (!selectedRole) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Arial" }}>
        <h1>🎮 역할 선택</h1>
        <p>원하는 역할을 선택하세요:</p>
        {allRoles.map((role) => (
          <button key={role} onClick={() => handleSelectRole(role)} style={{ margin: "0.5rem" }}>
            역할 {role.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (gameClear) {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", textAlign: "center" }}>
      <h1>🎉 축하합니다! 이제 빛을 볼 수 있어요!</h1>
      {selectedRole === "a" && (
        <button
          onClick={() => {
            socket.emit("restart-first-maze"); // ✅ 서버로 재시작 요청
            setGameClear(false); // 화면 초기화
          }}
          style={{
            marginTop: "1rem",
            padding: "0.7rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          첫 번째 미로로 돌아가기
        </button>
      )}
    </div>
  );
}

  if (selectedRole === "admin") {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🛠️ 관리자 패널</h1>
      <p><strong>📍 현재 단계:</strong> {mazeIndex + 1}단계</p> {/* ✅ 현재 단계 표시 */}

      <p>현재 미로 단계를 초기화하거나 원하는 단계로 이동하세요.</p>

      <button onClick={() => socket.emit("admin-set-maze", 0)} style={{ margin: "1rem", padding: "0.5rem" }}>
        🔄 1단계로 초기화
      </button>

      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => socket.emit("admin-set-maze", i)}
            style={{
              margin: "0.3rem",
              padding: "0.5rem",
              backgroundColor: "#ddd",
              borderRadius: "5px",
              border: "1px solid #aaa",
            }}
          >
            {i + 1}단계로 이동
          </button>
        ))}
      </div>

      <button onClick={resetRole} style={{ marginTop: "2rem" }}>
        🔙 역할 초기화
      </button>
    </div>

      );
    }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", position: "relative" }}>
      <h1>빛을 찾아서</h1>
      {/*<p><strong>내 역할:</strong> {selectedRole}</p>*/}
      <p><strong>현재 미로 단계:</strong> {mazeIndex + 1}단계</p>
      <p><strong>현재 위치:</strong> x: {position.x}, y: {position.y}</p>

      {selectedRole !== "a" ? (
        <div>
          {selectedRole === "b" && <button onClick={() => handleMove("left")}>← 왼쪽</button>}
          {selectedRole === "c" && <button onClick={() => handleMove("right")}>→ 오른쪽</button>}
          {selectedRole === "d" && <button onClick={() => handleMove("down")}>↓ 아래</button>}
          {selectedRole === "e" && <button onClick={() => handleMove("up")}>↑ 위</button>}
        </div>
      ) : (
        <div>🗺️ 당신은 길을 안내하는 역할입니다.</div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h3>🧱 미로</h3>
        <div
          onClick={() => {
            if (selectedRole === "b") handleMove("left");
            else if (selectedRole === "c") handleMove("right");
            else if (selectedRole === "d") handleMove("down");
            else if (selectedRole === "e") handleMove("up");
          }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${maze[0]?.length || 0}, 30px)`,
            cursor: ["b", "c", "d", "e"].includes(selectedRole) ? "pointer" : "default",
          }}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isPlayerHere = position.x === x && position.y === y;
              const isYHere = yPositions.some((yPos) => yPos.x === x && yPos.y === y);
              const isWall = cell === 1;
              const isExit = cell === 2 || cell === 3;

              let bgColor = "white";
              let border = "1px solid #ccc";
              let content = "";

              if (selectedRole !== "a") {
                // b~e는 출구는 보이고, X와 Y는 표시되도록
                if (isExit) {
                  bgColor = "#0f0";
                  content = "✅";
                } else if (isPlayerHere) {
                  bgColor = "red";
                } else if (isYHere) {
                  bgColor = "black";
                  content = "☠️";
                  border = "2px solid #f00";
                } else {
                  bgColor = "#eee";
                }
              } else {
                // a는 전체 표시
                if (isWall) bgColor = "black";
                else if (isExit) {
                  bgColor = "#0f0";
                  content = "✅";
                } else if (isPlayerHere) {
                  bgColor = "red";
                } else if (isYHere) {
                  bgColor = "black";
                  content = "☠️";
                  border = "2px solid #f00";
                }
              }

              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: bgColor,
                    border: border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  {isYHere ? "☠️" : selectedRole === "a" && isExit ? "✅" : ""}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={resetRole}
        style={{
          marginTop: "2rem",         // 미로 아래 여백
          backgroundColor: "#eee",
          padding: "0.5rem 1rem",
          borderRadius: "5px",
          border: "1px solid #aaa",
          fontSize: "1rem",
        }}
      >
        🔄 역할 초기화 하기 
      </button>
    </div>
  );
}

export default App;
