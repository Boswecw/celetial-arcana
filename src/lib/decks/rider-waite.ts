import type { Card } from '../tarot';
import { getCardImageUrl } from './wikimedia-urls';

const WIKIMEDIA_BASE = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

/**
 * Rider-Waite-Smith Tarot Deck
 * Public domain images from Wikimedia Commons
 * All cards include upright and reversed interpretations
 */
export const riderWaiteDeck: Card[] = [
  // Major Arcana (0-21)
  {
    id: '0',
    name: 'The Fool',
    upright: 'New beginnings, taking risks, innocence, spontaneity',
    reversed: 'Recklessness, naivety, lack of planning, hesitation',
    image: getCardImageUrl('0'),
  },
  {
    id: '1',
    name: 'The Magician',
    upright: 'Manifestation, resourcefulness, power, inspired action',
    reversed: 'Manipulation, poor planning, untapped potential, lack of concentration',
  },
  {
    id: '2',
    name: 'The High Priestess',
    upright: 'Intuition, sacred knowledge, divine feminine, the subconscious',
    reversed: 'Secrets, disconnection from intuition, superficiality, hidden agendas',
  },
  {
    id: '3',
    name: 'The Empress',
    upright: 'Femininity, beauty, abundance, nature, sensuality',
    reversed: 'Self-doubt, lack of growth, insecurity, dependence on others',
  },
  {
    id: '4',
    name: 'The Emperor',
    upright: 'Authority, establishment, structure, control, father figure',
    reversed: 'Domination, excessive control, lack of discipline, immaturity',
  },
  {
    id: '5',
    name: 'The Hierophant',
    upright: 'Tradition, conformity, morality, ethics, education',
    reversed: 'Rebellion, subversion, unorthodoxy, personal beliefs',
  },
  {
    id: '6',
    name: 'The Lovers',
    upright: 'Relationships, choices, alignment, values, connection',
    reversed: 'Misalignment, conflict, detachment, misunderstanding',
  },
  {
    id: '7',
    name: 'The Chariot',
    upright: 'Control, willpower, determination, self-discipline, ambition',
    reversed: 'Self-doubt, lack of direction, aggression, lack of control',
  },
  {
    id: '8',
    name: 'Strength',
    upright: 'Inner strength, courage, patience, control, compassion',
    reversed: 'Self-doubt, weakness, insecurity, low energy, self-sabotage',
  },
  {
    id: '9',
    name: 'The Hermit',
    upright: 'Soul searching, introspection, inner guidance, contemplation',
    reversed: 'Isolation, loneliness, withdrawal, lost, disconnected',
  },
  {
    id: '10',
    name: 'Wheel of Fortune',
    upright: 'Good luck, karma, life cycles, destiny, turning point',
    reversed: 'Bad luck, resistance to change, breaking cycles, bad timing',
  },
  {
    id: '11',
    name: 'Justice',
    upright: 'Justice, fairness, truth, cause and effect, accountability',
    reversed: 'Injustice, bias, unfairness, lack of accountability, dishonesty',
  },
  {
    id: '12',
    name: 'The Hanged Man',
    upright: 'Pause, suspension, restriction, letting go, new perspective',
    reversed: 'Delay, resistance, stalling, indecision, lack of perspective',
  },
  {
    id: '13',
    name: 'Death',
    upright: 'Transformation, endings, beginnings, change, cycles',
    reversed: 'Resistance to change, personal transformation, inner purging',
  },
  {
    id: '14',
    name: 'Temperance',
    upright: 'Balance, moderation, patience, finding meaning, purpose',
    reversed: 'Imbalance, excess, lack of patience, self-healing, re-alignment',
  },
  {
    id: '15',
    name: 'The Devil',
    upright: 'Bondage, materialism, playfulness, detachment, sexuality',
    reversed: 'Detachment, overcoming adversity, breaking free, reclaiming power',
  },
  {
    id: '16',
    name: 'The Tower',
    upright: 'Sudden change, upheaval, chaos, revelation, awakening',
    reversed: 'Averted disaster, delayed change, fear of change, stagnation',
  },
  {
    id: '17',
    name: 'The Star',
    upright: 'Hope, faith, purpose, renewal, spirituality, healing',
    reversed: 'Despair, lack of faith, discouragement, lost sense of purpose',
  },
  {
    id: '18',
    name: 'The Moon',
    upright: 'Illusion, fear, anxiety, subconscious, intuition, uncertainty',
    reversed: 'Clarity, release of fear, growing awareness, truth revealed',
  },
  {
    id: '19',
    name: 'The Sun',
    upright: 'Success, vitality, joy, warmth, illumination, positivity',
    reversed: 'Sadness, lack of clarity, depression, negativity, temporary setback',
  },
  {
    id: '20',
    name: 'Judgement',
    upright: 'Reckoning, awakening, renewal, reckoning, inner calling',
    reversed: 'Self-doubt, harsh self-criticism, doubt, an inner calling',
  },
  {
    id: '21',
    name: 'The World',
    upright: 'Completion, accomplishment, fulfillment, wholeness, fulfillment',
    reversed: 'Incompleteness, lack of closure, seeking, lack of closure',
  },

  // Minor Arcana - Wands (22-35)
  {
    id: '22',
    name: 'Ace of Wands',
    upright: 'Inspiration, new opportunities, growth, potential, new beginnings',
    reversed: 'Lack of energy, lack of growth, stagnation, lack of direction',
  },
  {
    id: '23',
    name: 'Two of Wands',
    upright: 'Planning, making decisions, leaving home, personal power',
    reversed: 'Lack of planning, lack of direction, seeking, indecision',
  },
  {
    id: '24',
    name: 'Three of Wands',
    upright: 'Exploration, foresight, progress, expansion, overseas',
    reversed: 'Lack of foresight, lack of progress, delays, lack of direction',
  },
  {
    id: '25',
    name: 'Four of Wands',
    upright: 'Celebration, harmony, marriage, community, home',
    reversed: 'Lack of closure, family conflict, lack of harmony, instability',
  },
  {
    id: '26',
    name: 'Five of Wands',
    upright: 'Conflict, disagreement, tension, competition, diversity',
    reversed: 'Avoiding conflict, resolution, inner peace, harmony',
  },
  {
    id: '27',
    name: 'Six of Wands',
    upright: 'Success, public recognition, leadership, victory, confidence',
    reversed: 'Lack of recognition, lack of confidence, failure, lack of success',
  },
  {
    id: '28',
    name: 'Seven of Wands',
    upright: 'Perseverance, determination, competition, protection, willpower',
    reversed: 'Giving up, lack of determination, lack of willpower, surrender',
  },
  {
    id: '29',
    name: 'Eight of Wands',
    upright: 'Speed, action, progress, alignment, momentum',
    reversed: 'Delays, lack of progress, stagnation, lack of alignment',
  },
  {
    id: '30',
    name: 'Nine of Wands',
    upright: 'Resilience, courage, persistence, boundaries, strength',
    reversed: 'Exhaustion, lack of resilience, lack of boundaries, defensiveness',
  },
  {
    id: '31',
    name: 'Ten of Wands',
    upright: 'Burden, responsibility, hard work, completion, exhaustion',
    reversed: 'Lack of responsibility, lack of burden, freedom, relief',
  },
  {
    id: '32',
    name: 'Page of Wands',
    upright: 'Exploration, excitement, freedom, innocence, wanderlust',
    reversed: 'Lack of direction, lack of excitement, lack of growth, immaturity',
  },
  {
    id: '33',
    name: 'Knight of Wands',
    upright: 'Energy, passion, adventure, impulsiveness, charisma',
    reversed: 'Lack of direction, lack of passion, lack of energy, recklessness',
  },
  {
    id: '34',
    name: 'Queen of Wands',
    upright: 'Confidence, independence, determination, charisma, boldness',
    reversed: 'Lack of confidence, lack of independence, lack of determination',
  },
  {
    id: '35',
    name: 'King of Wands',
    upright: 'Leadership, vision, entrepreneurship, boldness, passion',
    reversed: 'Lack of vision, lack of leadership, lack of passion, impulsiveness',
  },

  // Minor Arcana - Cups (36-49)
  {
    id: '36',
    name: 'Ace of Cups',
    upright: 'New feelings, relationships, emotionality, creativity, new beginnings',
    reversed: 'Lack of feelings, blocked emotions, lack of creativity, closed off',
  },
  {
    id: '37',
    name: 'Two of Cups',
    upright: 'Partnerships, relationships, intimacy, connection, unity',
    reversed: 'Lack of connection, lack of intimacy, separation, conflict',
  },
  {
    id: '38',
    name: 'Three of Cups',
    upright: 'Celebration, friendship, community, gatherings, joy',
    reversed: 'Lack of community, lack of celebration, isolation, loneliness',
  },
  {
    id: '39',
    name: 'Four of Cups',
    upright: 'Apathy, contemplation, reevaluation, meditation, indifference',
    reversed: 'Acceptance, new opportunities, awakening, moving forward',
  },
  {
    id: '40',
    name: 'Five of Cups',
    upright: 'Grief, loss, sadness, disappointment, bereavement',
    reversed: 'Acceptance, moving forward, finding peace, forgiveness',
  },
  {
    id: '41',
    name: 'Six of Cups',
    upright: 'Familiarity, childhood, innocence, nostalgia, simplicity',
    reversed: 'Lack of innocence, lack of simplicity, moving forward, letting go',
  },
  {
    id: '42',
    name: 'Seven of Cups',
    upright: 'Illusion, wishful thinking, choices, opportunities, illusion',
    reversed: 'Clarity, disillusionment, awakening, truth, reality',
  },
  {
    id: '43',
    name: 'Eight of Cups',
    upright: 'Abandonment, withdrawal, escapism, leaving, moving on',
    reversed: 'Inability to move on, stagnation, lack of progress, staying',
  },
  {
    id: '44',
    name: 'Nine of Cups',
    upright: 'Satisfaction, gratitude, abundance, wish fulfillment, contentment',
    reversed: 'Lack of satisfaction, lack of gratitude, lack of abundance',
  },
  {
    id: '45',
    name: 'Ten of Cups',
    upright: 'Harmony, happiness, alignment, family, wholeness',
    reversed: 'Lack of harmony, lack of happiness, conflict, misalignment',
  },
  {
    id: '46',
    name: 'Page of Cups',
    upright: 'Curiosity, sensitivity, creativity, innocence, wonder',
    reversed: 'Lack of creativity, lack of sensitivity, lack of wonder, immaturity',
  },
  {
    id: '47',
    name: 'Knight of Cups',
    upright: 'Charm, grace, elegance, seduction, romance',
    reversed: 'Lack of charm, lack of grace, lack of romance, moodiness',
  },
  {
    id: '48',
    name: 'Queen of Cups',
    upright: 'Compassion, creativity, intuition, sensitivity, nurturing',
    reversed: 'Lack of compassion, lack of creativity, lack of intuition',
  },
  {
    id: '49',
    name: 'King of Cups',
    upright: 'Diplomacy, tact, emotional balance, control, compassion',
    reversed: 'Lack of control, lack of balance, emotional instability, coldness',
  },

  // Minor Arcana - Swords (50-63)
  {
    id: '50',
    name: 'Ace of Swords',
    upright: 'Clarity, truth, new ideas, breakthrough, communication',
    reversed: 'Confusion, lack of clarity, lack of communication, blocked',
  },
  {
    id: '51',
    name: 'Two of Swords',
    upright: 'Stalemate, indecision, difficult choices, blocked, tension',
    reversed: 'Clarity, decision making, moving forward, resolution',
  },
  {
    id: '52',
    name: 'Three of Swords',
    upright: 'Heartbreak, emotional pain, sorrow, grief, difficult times',
    reversed: 'Healing, forgiveness, moving forward, recovery',
  },
  {
    id: '53',
    name: 'Four of Swords',
    upright: 'Rest, respite, contemplation, truce, pause',
    reversed: 'Restlessness, lack of rest, agitation, lack of peace',
  },
  {
    id: '54',
    name: 'Five of Swords',
    upright: 'Conflict, defeat, loss, betrayal, unfair advantage',
    reversed: 'Reconciliation, moving forward, resolution, acceptance',
  },
  {
    id: '55',
    name: 'Six of Swords',
    upright: 'Transition, moving forward, travel, departure, progress',
    reversed: 'Resistance to change, stagnation, lack of progress, stuck',
  },
  {
    id: '56',
    name: 'Seven of Swords',
    upright: 'Deception, betrayal, trickery, cunning, theft',
    reversed: 'Honesty, coming clean, truth revealed, integrity',
  },
  {
    id: '57',
    name: 'Eight of Swords',
    upright: 'Restriction, confusion, powerlessness, entrapment, limitation',
    reversed: 'Freedom, release, clarity, empowerment, breakthrough',
  },
  {
    id: '58',
    name: 'Nine of Swords',
    upright: 'Anxiety, worry, fear, nightmares, despair',
    reversed: 'Hope, recovery, peace of mind, moving forward',
  },
  {
    id: '59',
    name: 'Ten of Swords',
    upright: 'Betrayal, loss, ending, defeat, painful conclusion',
    reversed: 'Recovery, healing, moving forward, new beginning',
  },
  {
    id: '60',
    name: 'Page of Swords',
    upright: 'Curiosity, restlessness, mental activity, innocence, new ideas',
    reversed: 'Lack of curiosity, lack of mental activity, immaturity, deception',
  },
  {
    id: '61',
    name: 'Knight of Swords',
    upright: 'Intellect, communication, logic, bravery, impulsiveness',
    reversed: 'Lack of communication, lack of logic, impulsiveness, aggression',
  },
  {
    id: '62',
    name: 'Queen of Swords',
    upright: 'Clarity, truth, independence, intellect, perception',
    reversed: 'Lack of clarity, lack of truth, lack of independence, coldness',
  },
  {
    id: '63',
    name: 'King of Swords',
    upright: 'Intellect, authority, truth, logic, justice',
    reversed: 'Lack of truth, lack of logic, abuse of power, tyranny',
  },

  // Minor Arcana - Pentacles (64-77)
  {
    id: '64',
    name: 'Ace of Pentacles',
    upright: 'New opportunity, prosperity, abundance, new beginnings, potential',
    reversed: 'Lack of opportunity, lack of prosperity, missed opportunity',
  },
  {
    id: '65',
    name: 'Two of Pentacles',
    upright: 'Balance, adaptability, time management, prioritization, flexibility',
    reversed: 'Imbalance, lack of adaptability, lack of flexibility, disorganization',
  },
  {
    id: '66',
    name: 'Three of Pentacles',
    upright: 'Teamwork, collaboration, learning, growth, implementation',
    reversed: 'Lack of teamwork, lack of collaboration, lack of growth, delays',
  },
  {
    id: '67',
    name: 'Four of Pentacles',
    upright: 'Stability, security, control, possessiveness, hoarding',
    reversed: 'Lack of control, lack of security, generosity, letting go',
  },
  {
    id: '68',
    name: 'Five of Pentacles',
    upright: 'Hardship, poverty, insecurity, lack, loss',
    reversed: 'Recovery, improvement, stability, security, new opportunity',
  },
  {
    id: '69',
    name: 'Six of Pentacles',
    upright: 'Generosity, charity, sharing, fairness, abundance',
    reversed: 'Lack of generosity, lack of fairness, selfishness, inequality',
  },
  {
    id: '70',
    name: 'Seven of Pentacles',
    upright: 'Assessment, perseverance, effort, growth, investment',
    reversed: 'Lack of growth, lack of effort, lack of investment, impatience',
  },
  {
    id: '71',
    name: 'Eight of Pentacles',
    upright: 'Apprenticeship, skill, mastery, learning, dedication',
    reversed: 'Lack of skill, lack of mastery, lack of dedication, misdirection',
  },
  {
    id: '72',
    name: 'Nine of Pentacles',
    upright: 'Abundance, luxury, self-sufficiency, financial independence, success',
    reversed: 'Lack of abundance, lack of success, financial loss, dependence',
  },
  {
    id: '73',
    name: 'Ten of Pentacles',
    upright: 'Wealth, family, legacy, inheritance, stability',
    reversed: 'Lack of wealth, lack of family, lack of legacy, instability',
  },
  {
    id: '74',
    name: 'Page of Pentacles',
    upright: 'Ambition, desire, diligence, focus, new opportunity',
    reversed: 'Lack of ambition, lack of focus, lack of opportunity, immaturity',
  },
  {
    id: '75',
    name: 'Knight of Pentacles',
    upright: 'Reliability, responsibility, hard work, dedication, loyalty',
    reversed: 'Lack of reliability, lack of responsibility, lack of dedication',
  },
  {
    id: '76',
    name: 'Queen of Pentacles',
    upright: 'Nurturing, practicality, creature comforts, financial security',
    reversed: 'Lack of nurturing, lack of practicality, financial insecurity',
  },
  {
    id: '77',
    name: 'King of Pentacles',
    upright: 'Wealth, success, leadership, abundance, security',
    reversed: 'Lack of wealth, lack of success, lack of leadership, greed',
  },
];

