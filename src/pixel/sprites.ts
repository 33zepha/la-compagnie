// Tous les visuels sont dessinés ici, pixel par pixel : aucune image extérieure.
// '.' = transparent. Les contours sombres sont ajoutés automatiquement par <Sprite>.
// `mirror` : seules les colonnes de gauche sont dessinées, la droite est leur reflet.
// Couleurs dynamiques : T (teinte), L (teinte claire), t (teinte sombre), H (cheveux), C (cape), c (cape sombre), S (peau).

export const FIXED: Record<string, string> = {
  D: '#2b1d14', '0': '#0d0b10', W: '#f4f1e6', G: '#d4a72c', g: '#9a7420', B: '#7a4a2a', b: '#4a2e1a',
  R: '#a33b2b', r: '#e0412a', K: '#6b6f66', k: '#a8aca2', N: '#4f7a3a', n: '#7fae5a', Y: '#f2d36b', U: '#5b7fa8',
  P: '#e8d9b0', p: '#c9b78a', o: '#1b1410', m: '#8a4a3a', M: '#9aa3a8', V: '#6d8f5a', v: '#c9a45a', I: '#5a5f6e', A: '#8a8a86',
  Q: '#2a2530', q: '#3b3442', O: '#6b7a3a', E: '#7c8a76', e: '#5a6656',
};

export type SpriteDef = { rows: string[]; mirror?: boolean; tint?: string; overlay?: [number, number, string][]; outline?: string };

const I = (tint: string, ...rows: string[]): SpriteDef => ({ rows, tint });

export const ITEM_SPRITES: Record<string, SpriteDef> = {
  sword: I('#c9d3da', '.....LT.....', '.....LT.....', '.....LT.....', '.....LT.....', '.....LT.....', '.....LT.....', '.....LT.....', '..gGGGGGGg..', '.....bb.....', '.....bb.....', '....GGGG....', '............'),
  dagger: I('#c9d3da', '............', '............', '.....LT.....', '.....LT.....', '.....LT.....', '.....LT.....', '....gGGg....', '.....bb.....', '.....bb.....', '.....GG.....', '............', '............'),
  axe: I('#a8aca2', '....bb......', '....bbTTT...', '....bbTTTT..', '....bbLTTTt.', '....bbLTTTt.', '....bbTTTT..', '....bbTTT...', '....bb......', '....bb......', '....bb......', '....bb......', '....kk......'),
  bow: I('#7a4a2a', '......BB....', '.....B..W...', '....B...W...', '...B....W...', '...B....W...', '...G....W...', '...G....W...', '...B....W...', '....B...W...', '.....B..W...', '......BB....', '............'),
  staff: I('#e8f2ff', '.....LT.....', '....LTTL....', '.....TT.....', '....b.Bb....', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....bb.....'),
  shield: I('#4f7a3a', '............', '..TTTTTTTT..', '..TLTTTTTT..', '..TTTWWTTT..', '..TTWWWWTT..', '..TTTWWTTT..', '..TTTWTWTT..', '...TTTTTT...', '....TTTT....', '.....TT.....', '............', '............'),
  mail: I('#a8b4bc', '............', '...TT..TT...', '.TTTTTTTTTT.', 'TTTLtTTtTTTT', 'TT.LTTTTT.TT', 'TT.TtTTtT.TT', '...TTTTTT...', '...TtTTtT...', '...TTTTTT...', '...TtTTtT...', '...TTTTTT...', '............'),
  cloak: I('#7d7f78', '............', '....GTTG....', '....TTTT....', '...TTTTTT...', '...TTtTTT...', '..TLTtTTTT..', '..TLTtTTTT..', '..TTtTTtTT..', '.TTTtTTtTTT.', '.TTTtTTtTTT.', '.TTTTTTTTTT.', '............'),
  helm: I('#9aa3a8', '............', '.....TT.....', '....TTTT....', '...TLTTTT...', '..TTLTTTTT..', '..TTTTTTTT..', '..TDDTTDDT..', '..TTTTTTTT..', '..TT....TT..', '..TT....TT..', '............', '............'),
  ring: I('#d4a72c', '............', '............', '....TTTT....', '...LT..TT...', '..LT....Tt..', '..T......t..', '..T......t..', '..TT....tt..', '...Tttttt...', '....tttt....', '............', '............'),
  brooch: I('#6aa84f', '............', '........T...', '.......TT...', '......TLT...', '.....TLTT...', '....TLTTT...', '...TLTTT....', '...TTTT.....', '..GTTT......', '.G..........', '............', '............'),
  vial: I('#f2d36b', '............', '.....kk.....', '.....WW.....', '....LWWL....', '...LWYYWL...', '...WYYYYW...', '...WYYYYW...', '...LWYYWL...', '....LWWL....', '............', '............', '............'),
  pipe: I('#7a4a2a', '............', '............', '...k........', '..k.k.......', '...k........', '..BBB.......', '..BBB.......', '..BBBbbbbbb.', '...BB.....b.', '............', '............', '............'),
  mushroom: I('#a33b2b', '............', '............', '....TTTT....', '..TTWTTTTT..', '.TTTTTTWTTT.', '.TWTTTTTTTT.', '..tttttttt..', '....PPPP....', '....PPPP....', '....PPPP....', '...pPPPPp...', '............'),
  horn: I('#e8dcc0', '............', '............', '.........GG.', '........TTG.', '.......TTT..', '.....TTTL...', '..TTTTTL....', '.TTTTTt.....', 'GTTtt.......', '.G..........', '............', '............'),
  lantern: I('#f2d36b', '.....kk.....', '....k..k....', '....kkkk....', '...kTTTTk...', '...kTWWTk...', '...kTWWTk...', '...kTTTTk...', '...kkkkkk...', '....kkkk....', '............', '............', '............'),
  key: I('#d4a72c', '............', '............', '..TTT.......', '.T...T......', '.T...TTTTTT.', '.T...T..T.T.', '..TTT...T...', '............', '............', '............', '............', '............'),
  map: I('#e8d9b0', '............', '.pPPPPPPPPp.', '.PPPUUPPPPP.', '.PPUUPPPKPP.', '.PPPPPPKKKP.', '.PRPPPPPPPP.', '.PPRPPNNPPP.', '.PPPRPNNPPP.', '.PPPPRRPRPP.', '.PPPPPPPRPP.', '.pPPPPPPPPp.', '............'),
  book: I('#7a4a2a', '............', '..TTTTTTTT..', '..TLTTTTTTW.', '..TTTGGTTTW.', '..TTGTTGTTW.', '..TTTGGTTTW.', '..TTTTTTTTW.', '..TTTTTTTTW.', '..TTTTTTTTW.', '..tttttttt..', '............', '............'),
  gem: I('#5b7fa8', '............', '............', '....LLTT....', '...LLTTTT...', '..LTTTTTTt..', '..TTTTTTtt..', '...TTTTtt...', '....TTtt....', '.....tt.....', '............', '............', '............'),
  coin: I('#d4a72c', '............', '............', '....TTTT....', '...TLLTTt...', '..TLTTTTTt..', '..TLTttTTt..', '..TTTttTTt..', '..TTTTTTTt..', '...TTTTTt...', '....tttt....', '............', '............'),
  potion: I('#c0392b', '............', '.....BB.....', '.....kk.....', '.....kk.....', '....kTTk....', '...kTLTTk...', '..kTLTTTTk..', '..kTTTTTTk..', '..kTTTTTTk..', '...kttttk...', '....kkkk....', '............'),
  lembas: I('#e8d9b0', '............', '............', '............', '..NNNNNNNN..', '.NnPPPPPPnN.', '.NPPPPPPPPN.', '.NPPpPPpPPN.', '.NPPPPPPPPN.', '.NnPPPPPPnN.', '..NNNNNNNN..', '............', '............'),
  scroll: I('#e8d9b0', '............', '.pTTTTTTTTp.', '..TTTTTTTT..', '..TkkkkkkT..', '..TTTTTTTT..', '..TkkkkkTT..', '..TTTTTTTT..', '..TkkkkkkT..', '..TTTTTTTT..', '.pTTTTTTTTp.', '....RR......', '............'),
  rope: I('#b89a6a', '............', '............', '....TTTT....', '..TT....TT..', '.T..TTTT..T.', '.T.T....T.T.', '.T.T.TT.T.T.', '.T.T....T.T.', '.T..TTTT..T.', '..TT....TT..', '....TTTT....', '............'),
  boots: I('#7a4a2a', '............', '...TTTT.....', '...TLTT.....', '...TLTT.....', '...TTTT.....', '...TTTT.....', '...TTTTT....', '...TTTTTTT..', '...TTTTTTTT.', '...bbbbbbbb.', '............', '............'),
  acorn: I('#c2762e', '............', '............', '......b.....', '....BBBB....', '...BbBbBB...', '...BBBBBB...', '....TTTT....', '....TLTT....', '....TTTT....', '.....TT.....', '............', '............'),
  heart: I('#a33b2b', '............', '............', '..TTT..TTT..', '.TWTTTTTTTT.', '.TLTTTTTTTT.', '.TTTTTTTTTT.', '..TTTTTTTT..', '...TTTTTT...', '....TTTT....', '.....TT.....', '............', '............'),
  pot: I('#6b6f66', '....k..k....', '.....k..k...', '....k..k....', '..k......k..', '..kkkkkkkk..', '.TTTTTTTTTT.', '.TLTTTTTTTT.', '.TTTTTTTTTT.', '..TTTTTTTT..', '...T....T...', '............', '............'),
  hammer: I('#9aa3a8', '............', '..TTTTTTTT..', '..TLLTTTTT..', '..TTTTTTTT..', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....BB.....', '.....bb.....', '............', '............'),
  chest: I('#7a4a2a', '............', '............', '..TTTTTTTT..', '.TLTTTTTTTT.', '.GGGGGGGGGG.', '.TTTTYYTTTT.', '.TTTTGGTTTT.', '.TTTTTTTTTT.', '.TTTTTTTTTT.', '.GGGGGGGGGG.', '............', '............'),
  skull: I('#e8dcc0', '............', '....TTTT....', '...TTTTTT...', '..TTTTTTTT..', '..T00TT00T..', '..T00TT00T..', '..TTTT0TTT..', '...TTTTTT...', '...T.T.TT...', '............', '............', '............'),
  star: I('#f2d36b', '............', '.....TT.....', '.....TT.....', '....TLLT....', 'TTTTTLLTTTTT', '.TTTTTTTTTT.', '..TTTTTTTT..', '..TTT..TTT..', '.TT......TT.', '............', '............', '............'),
  campfire: I('#e0412a', '............', '.....Y......', '....YTY.....', '....TYTT....', '...TTYYTT...', '...TYYYYT...', '....TYYT....', '..bBBBBBBb..', '.bB.bBBb.Bb.', '............', '............', '............'),
};

export type People = 'hobbit' | 'elfe' | 'nain' | 'homme' | 'istar';
// Avatars 16×20, moitié gauche (8 colonnes) reflétée.
export const AVATARS: Record<People, SpriteDef> = {
  hobbit: { mirror: true, rows: [
    '........', '........', '........', '........', '.....HHH', '....HHHH', '...HHHHH', '...HSSSS', '...SSoSS', '....SSSS', '....SSSm',
    '.....SSS', '...CvvvN', '..CCvvvv', '..CCvbbb', '..CSvvvv', '...C.BBB', '.....BB.', '.....BB.', '....SSS.'] },
  elfe: { mirror: true, rows: [
    '........', '.....HHH', '....HHHH', '....HSSS', '...SHSoS', '....HSSS', '....HSSm', '....HHSS', '...CHVVV', '..CCHVVV',
    '..CCVVVV', '..CCVbbb', '..CSVVVV', '..CCVVVV', '..cCVVVV', '...c.VVV', '.....VV.', '.....VV.', '.....bb.', '....bbb.'],
    overlay: [[12, 9, 'B'], [13, 10, 'B'], [13, 11, 'B'], [13, 12, 'B'], [13, 13, 'B'], [12, 14, 'B']] },
  nain: { mirror: true, rows: [
    '........', '........', '........', '........', '.....MMM', '....MMMM', '...MMMMM', '...MMMMM', '...SSoSS', '...HHSSS', '..HHHHHm',
    '..HHHHHH', '.CCHHHHH', '.CCIHHHH', '.CSIbbbb', '.CCIIIII', '..C.IIII', '....II..', '....II..', '...bbb..'],
    overlay: [[14, 9, 'k'], [15, 9, 'k'], [14, 10, 'k'], [15, 10, 'k'], [14, 11, 'K'], [13, 11, 'B'], [13, 12, 'B'], [13, 13, 'B'], [13, 14, 'B']] },
  homme: { mirror: true, rows: [
    '........', '........', '.....HHH', '....HHHH', '....HSSS', '...HSSoS', '....SSSS', '....SSSm', '.....SSS', '...CIIII', '..CCIIII',
    '..CCIIII', '..CCIbbb', '..CSIIII', '..CCIIII', '..cC.III', '.....BB.', '.....BB.', '.....bb.', '....bbb.'],
    overlay: [[13, 8, 'k'], [13, 9, 'k'], [13, 10, 'k'], [13, 11, 'k'], [13, 12, 'k'], [12, 13, 'G'], [13, 13, 'G'], [14, 13, 'G'], [13, 14, 'b']] },
  istar: { mirror: true, rows: [
    '.......C', '......CC', '......CC', '.....CCC', '....CCCC', '..CCCCCC', '....SSSS', '....SoSS', '....HHSS', '....HHHH', '...CHHHH',
    '..CCHHHH', '..CCAHHA', '..CSAAAA', '..CCAAAA', '..CCAAAA', '..cCAAAA', '...cAAAA', '....AAAA', '....bbb.'],
    overlay: [[1, 1, 'W'], [1, 2, 'B'], [1, 3, 'B'], [1, 4, 'B'], [1, 5, 'B'], [1, 6, 'B'], [1, 7, 'B'], [1, 8, 'B'], [1, 9, 'B'], [1, 10, 'B'], [1, 11, 'B'], [1, 12, 'B'], [1, 13, 'B'], [1, 14, 'B'], [1, 15, 'B'], [1, 16, 'B'], [1, 17, 'B'], [1, 18, 'B'], [1, 19, 'b'], [0, 0, 'Y'], [2, 0, 'Y'], [1, 0, 'W'], [2, 13, 'S']] },
};

// Boss 16×16, moitié gauche reflétée.
export const BOSSES: Record<string, SpriteDef & { name: string }> = {
  nazgul: { name: 'Nazgûl', mirror: true, outline: '#0d0b10', rows: ['........', '.....QQQ', '....QQQQ', '...QQQQQ', '...QQqqq', '..QQq000', '..QQq0r0', '..QQ0000', '..QQQ000', '.QQQQQQQ', '.QQQQQQQ', 'QQQQqQQQ', 'QQQQqQQQ', 'QQ.QqQQQ', 'Q...QQQQ', '....Q.QQ'] },
  troll: { name: 'Troll des cavernes', mirror: true, rows: ['........', '........', '.....EEE', '....EEEE', '...EEEEE', '...EYEEE', '...EEEEE', '...EeWee', '..EEEEEE', '.EEEBBBB', 'EEEEbbbb', 'EE.EBBBB', 'EE.EBBBB', '...EBBBB', '...EE..E', '..EEE...'] },
  orque: { name: 'Orque', mirror: true, rows: ['........', '........', '........', '....MMMM', '...MMMMM', '...OOOOO', '...OrOOO', '...OOOOO', '....OWOO', '..KKKKKK', '.OKKKKKK', '.OKKkKKK', '.O.KKKKK', '...KKKKK', '...BB...', '..bbb...'] },
  araignee: { name: 'Araignée géante', mirror: true, rows: ['........', '........', 'Q.......', '.Q...QQQ', '..Q.QQQQ', 'Q..QQQQQ', '.QQQQQrQ', '...QQQQQ', '.QQQQQQQ', 'Q..QQqQQ', '..Q.QQqQ', '.Q...QQQ', 'Q.....QQ', '........', '........', '........'] },
  wargue: { name: 'Wargue', mirror: false, rows: ['................', '................', '................', '..KK............', '.KKKK...........', 'KKrKKKKKKKKK....', 'KKKKKKKKKKKKK...', '.WkKKKKKKKKKKK.K', '..KKKKKKKKKKKKK.', '....KKKKKKKKKK..', '....KK.KK.KK.KK.', '....KK.KK.KK.KK.', '...kk..kk.kk.kk.', '................', '................', '................'] },
};
export const BOSS_IDS = ['troll', 'orque', 'araignee', 'wargue'] as const;

export const EYE: SpriteDef = { outline: '#5a0f08', rows: [
  '.....rrrrrr.....', '...rrYYYYYYrr...', '.rrYYYYY0YYYYrr.', 'rYYYYYY00YYYYYYr', 'rYYYYYY00YYYYYYr', '.rrYYYYY0YYYYrr.', '...rrYYYYYYrr...', '.....rrrrrr.....'] };
