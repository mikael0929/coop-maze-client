import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://coop-maze-server.onrender.com");

const allRoles = ["a", "b", "c", "d", "e"];

function App() {
  const [maze, setMaze] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [position, setPosition] = useState({ x: 1, y: 1 });
  const [yPosition, setYPosition] = useState(null);
  const [gameClear, setGameClear] = useState(false);

  useEffect(() => {
    socket.on("init-maze", (mazeData) => {
      setMaze(mazeData);
    });

    socket.on("game-state", (state) => {
      setPosition(state.playerPosition);
      setYPosition(state.yPosition);
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



  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", position: "relative" }}>
      <h1>🎮 협동 미로 탈출 게임</h1>
      <p><strong>내 역할:</strong> {selectedRole}</p>
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
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${maze[0]?.length || 0}, 30px)`,
          }}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isPlayerHere = position.x === x && position.y === y;
              const isYHere = yPosition && yPosition.x === x && yPosition.y === y;
              const isWall = cell === 1;
              const isExit = cell === 2;

              let bgColor = "white";
              if (isWall) bgColor = "black";
              else if (isExit) bgColor = "#0f0";
              else if (isPlayerHere) bgColor = "red";
              else if (isYHere) bgColor = "black";
              else if (selectedRole !== "a") bgColor = "#eee";

              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: bgColor,
                    border: "1px solid #ccc",
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
          position: "absolute",
          bottom: 20,
          left: 20,
          backgroundColor: "#eee",
          padding: "0.5rem",
          borderRadius: "5px",
        }}
      >
        🔄 역할 초기화 하기 
      </button>
    </div>
  );
}

export default App;
