import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { Accelerometer } from 'expo-sensors';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;

const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 40;

export default function App() {
    const [playerX, setPlayerX] = useState((screenWidth - PLAYER_WIDTH) / 2);
    const [bullet, setBullet] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);


    const [gameStarted, setGameStarted] = useState(false);

    const [subscription, setSubscription] = useState(null);

    const subscribe = () => {
        Accelerometer.setUpdateInterval(50);
        setSubscription(
            Accelerometer.addListener(({ x }) => {
                const move = x * 70;
                setPlayerX((prev) => {
                    const newPos = prev - move;
                    const allowedPosition = Math.max(0, Math.min(newPos, screenWidth - PLAYER_WIDTH));
                    return allowedPosition;
                });
            })
        );
    };

    const unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    useEffect(() => {
        subscribe();
        return () => unsubscribe();
    }, []);


    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameOver) {
                setBullet((prev) =>
                    prev
                        .map((b) => ({ ...b, y: b.y + 15 }))
                        .filter((b) => b.y < screenHeight + 50)
                );
            }
        }, 60);
        return () => clearInterval(interval);
    }, [gameOver]);


    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameOver) {
                const block = {
                    id: Date.now(),
                    x: Math.random() * (screenWidth - BLOCK_WIDTH),
                    y: screenHeight,
                };

                setBlocks((prev) => [...prev, block]);
                setGameStarted(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameOver]);


    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameOver) {
                setBlocks((prev) =>
                    prev
                        .map((b) => ({ ...b, y: b.y - 5 }))
                        .filter((b) => b.y > -60)
                );
            }
        }, 60);

        return () => clearInterval(interval);
    }, [gameOver]);


    useEffect(() => {
        let newBlocks = [...blocks];
        let newBullets = [...bullet];
        let changed = false;

        newBlocks.forEach((block) => {
            newBullets.forEach((b) => {
                const hit =
                    b.x < block.x + BLOCK_WIDTH &&
                    b.x + BULLET_WIDTH > block.x &&
                    b.y < block.y + BLOCK_HEIGHT &&
                    b.y + BULLET_HEIGHT > block.y;

                if (hit) {
                    newBlocks = newBlocks.filter((x) => x.id !== block.id);
                    newBullets = newBullets.filter((x) => x.id !== b.id);

                    changed = true;
                    setScore((prev) => prev + 1);
                }
            });
        });

        if (changed) {
            setBlocks(newBlocks);
            setBullet(newBullets);
        }
    }, [bullet, blocks]);


    useEffect(() => {
        blocks.forEach((block) => {
            if (block.y <= PLAYER_HEIGHT + 20) {
                setGameOver(true);
            }
        });
    }, [blocks]);

    const handleBullet = () => {
        if (gameOver) return;

        setGameStarted(true);

        const newBullet = {
            id: Date.now(),
            x: playerX + (PLAYER_WIDTH - BULLET_WIDTH) / 2,
            y: PLAYER_HEIGHT,
        };

        setBullet((prev) => [...prev, newBullet]);
    };

    const restartGame = () => {
        setGameOver(false);
        setBlocks([]);
        setBullet([]);
        setPlayerX((screenWidth - PLAYER_WIDTH) / 2);
        setScore(0);
        setGameStarted(false);
    };

    return (
        <TouchableWithoutFeedback onPress={handleBullet}>
            <View style={styles.container}>

                <View style={[styles.player, { left: playerX }]} />


                <Text style={styles.scoreText}>Score: {score}</Text>


                {bullet.map((bull) => (
                    <View
                        style={[styles.bullet, { left: bull.x, bottom: bull.y }]}
                        key={bull.id}
                    />
                ))}
                {blocks.map((block) => (
                    <View
                        style={[styles.fallingBlock, { left: block.x, bottom: block.y }]}
                        key={block.id}
                    />
                ))}


                {gameOver && (
                    <View style={styles.gameOverBox}>
                        <Text style={styles.gameOverText}>GAME OVER</Text>

                        <Text style={styles.finalScoreText}>Your Score: {score}</Text>

                        <TouchableOpacity onPress={restartGame} style={styles.restartButton}>
                            <Text style={{ color: "white", fontSize: 18 }}>Restart</Text>
                        </TouchableOpacity>
                    </View>
                )}


                {!gameStarted && !gameOver && (
                    <Text style={styles.instruction}>Tilt your phone to move</Text>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 60,
    },
    player: {
        position: "absolute",
        bottom: 20,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        backgroundColor: "#FFF",
        borderWidth: 2,
        borderColor: "#000",
    },


    scoreText: {
        position: "absolute",
        top: 20,
        left: screenWidth / 2 - 50,
        color: "white",
        fontSize: 18,
        fontFamily: "Courier",
    },

    instruction: {
        position: "absolute",
        top: 80,
        color: "#fff",
        fontFamily: "Courier",
        fontSize: 14,
    },

    bullet: {
        position: "absolute",
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#000",
    },

    fallingBlock: {
        position: "absolute",
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "black",
    },

    gameOverBox: {
        position: "absolute",
        top: screenHeight / 2 - 100,
        justifyContent: "center",
        alignItems: "center",
    },
    gameOverText: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "bold",
        fontFamily: "Courier",
        marginBottom: 20,
    },
    finalScoreText: {
        color: "#FFF",
        fontSize: 20,
        marginBottom: 10,
        fontFamily: "Courier",
    },
    restartButton: {
        padding: 10,
        backgroundColor: "red",
        borderRadius: 8,
        paddingHorizontal: 25,
    },
});
