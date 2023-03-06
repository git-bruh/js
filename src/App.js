import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

const Symbols = {
    AVAILABLE: "?",
    ZERO: "O",
    KANTA: "X"
}

function arrayToGrid(flattened, nrows, ncols) {
    let out = [];

    for (let i = 0, flati = 0; i < nrows; i++) {
        out[i] = [];

        for (let j = 0; j < ncols; j++) {
            out[i].push(flattened[flati++]);
        }
    }

    return out;
}

function getFlatIdx(nrows, row_idx, col_idx) {
    return (row_idx * nrows) + col_idx;
}

function matrixGetTrivialDiagonals(rows, cols) {
    var indices = [];

    /*
     * [
     *   [X, X, X],
     *   [...]
     * ]
     */
    for (let i = 0; i < rows; i++) {
        let indice = [];

        for (let j = 0; j < cols; j++) {
            indice.push(getFlatIdx(rows, i, j));
        }

        indices.push(indice);
    }

    /*
     * [
     *   [X, ...],
     *   [X, ...],
     * ]
     */
    for (let i = 0; i < cols; i++) {
        let indice = [];

        for (let j = 0; j < rows; j++) {
            indice.push(getFlatIdx(rows, j, i));
        }

        indices.push(indice);
    }

    /*
     * [
     *   [X, ...],
     *   [..., X, ...],
     *   [..., ..., X]
     * ]
     */
    let indice_begin = [];

    for (let i = 0, j = 0; i < rows && j < cols; i++, j++) {
        indice_begin.push(getFlatIdx(rows, i, j));
    }

    /* Same but flipped */
    let indice_end = [];

    for (let i = rows, j = cols; i > 0 && j > 0; i--, j--) {
        indice_end.push(getFlatIdx(rows, i - 1, j - 1));
    }

    indices.push(indice_begin);
    indices.push(indice_end);

    return indices;
}

function Square({ val, won, onClickOuter }) {
    const className = function(val) {
        switch (val) {
            case Symbols.AVAILABLE: return "square-available";
            case Symbols.ZERO: return "square-zero"
            case Symbols.KANTA: return "square-kanta"
        }
    }(val);

    const won_cls = won ? "square-won" : "";

    return <button className={`square ${className} ${won_cls}`} onClick={onClickOuter}>{val}</button>;
}

function checkWon(squares, indices) {
    const checkInner = function(diagonal_indices) {
        let prev_char = null;

        for (let i = 0; i < diagonal_indices.length; i++) {
            const curr_char = squares[diagonal_indices[i]];

            if (curr_char === Symbols.AVAILABLE) {
                return false;
            }

            if (prev_char !== null && prev_char !== curr_char) {
                return false;
            }

            prev_char = curr_char;
        }

        return true;
    }

    for (let i = 0; i < indices.length; i++) {
        if (checkInner(indices[i])) {
            return indices[i];
        }
    }

    return null;
}

// TODO encapsulate in outer scope
const [ROWS, COLS] = [3, 3];
const DIAGONALS = matrixGetTrivialDiagonals(ROWS, COLS);

function App() {
    const [ROWS, COLS] = [3, 3];
    const [TIMEOUT_MS, TIMEOUT_REFRESH_MS] = [5000, 10];

    const [squares, setSquares] = useState(Array(ROWS * COLS).fill(Symbols.AVAILABLE));
    const [isXnext, setIsXnext] = useState(true);
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_MS);

    const symbol = isXnext ? Symbols.KANTA : Symbols.ZERO;

    const won = new Set(checkWon(squares, DIAGONALS));

    function onClick(idx) {
        if (squares[idx] !== Symbols.AVAILABLE) {
            alert(`Turn already executed for idx ${idx}`)
            return;
        }

        let mutated = squares.slice();
        mutated[idx] = symbol;

        setSquares(mutated);
        setIsXnext(!isXnext);
        setTimeLeft(TIMEOUT_MS);
    }

    const grid = arrayToGrid(squares, ROWS, COLS).map(
        (row, row_idx) => <div key={row_idx} className="squareFlex"> {
            row.map(
                (col, col_idx) => {
                    let flat_idx = getFlatIdx(ROWS, row_idx, col_idx);

                    return <Square key={flat_idx} val={col} won={won.has(flat_idx)}
                        onClickOuter={() => onClick(flat_idx)} />
                }
            )
        }</div>
    )

    useEffect(() => {
        if (won.size !== 0) {
            return;
        }

        // Don't need to check whether TIMEOUT_MS has actually elapsed here since
        // clearTimeout is called before every render, so we won't reach a state where
        // we automatically make a move right after the user made one
        const timer = setTimeout(() => {
            if (timeLeft === 0) {
                // TODO refactor into a class
                const available_idxs = squares.reduce((arr, curr, idx) => {
                    if (curr === Symbols.AVAILABLE) {
                        arr.push(idx);
                    }

                    return arr;
                }, []);

                if (available_idxs.length) {
                    const random_idx = available_idxs[Math.floor(Math.random() * available_idxs.length)];
                    onClick(random_idx);
                }
            } else {
                setTimeLeft(timeLeft - TIMEOUT_REFRESH_MS);
            }
        }, TIMEOUT_REFRESH_MS);

        return () => clearTimeout(timer);
    })

    return (<>
        {grid}
        <p>{`Turn: ${symbol} (Executing automatically in ${timeLeft} ms...)`}</p>
    </>)
}

export default App;
