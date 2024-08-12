import styled from "styled-components";

export const SmallStats = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 5px;
    @media (max-width: 900px) {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
`;

export const Stats = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 5px;
    @media (max-width: 900px) {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
`;

export const Stat = styled.div`
    position: relative;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    padding: 10px;
    background-color: var(--rs-gray-800);
    
`;

export const StatLabel = styled.div`
    color: var(--rs-gray-300);
    font-size: 0.8em;
    @media (max-width: 900px) {
        font-size: 0.7em;
    }
`;

export const StatValue = styled.div`
    color: var(--rs-gray-100);
    font-size: 1.5em;   
    @media (max-width: 900px) {
        font-size: 0.75em;
    } 
`;

export const StatSubValue = styled.div`
    color: var(--rs-gray-100);
    font-size: 1.2em;
     @media (max-width: 900px) {
        font-size: 0.75em;
    } 
`

export const StatCorner = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    font-weight: bold;
    padding: 3px;
    margin: 5px;
    border-radius: 4px;
    background-color: var(--rs-gray-800);
    color: var(--rs-gray-100);
    font-size: 0.8em;
    @media (max-width: 900px) {
        font-size: 0.7em;
    }
`;

export const StatGamma = function ({ value }: { value: number }) {
    return (
        <StatCorner className={value < 0 ? "redbg" : "greenbg"}>
            {value > 0 ? '+γ' : value < 0 ? '-γ' : ''}
        </StatCorner>
    )
}