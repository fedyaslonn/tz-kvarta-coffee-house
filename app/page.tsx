import Image from 'next/image';
import { OrderLink, OrderProvider } from '@/components/order-context';
import { LeadForm } from '@/components/lead-form';
import { coffees, workshop, type Coffee } from '@/lib/content';
import styles from './page.module.css';
import heroPhoto from '@/public/images/hero-coffee-square.webp';
import roastingPhoto from '@/public/images/roasting.webp';

function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  return <span aria-hidden="true">{direction === 'down' ? '↓' : '↗'}</span>;
}

function CoffeeBag({ coffee, small = false }: { coffee: Coffee; small?: boolean }) {
  return <div className={`${styles.bag} ${styles[coffee.color]} ${small ? styles.smallBag : ''}`} aria-hidden="true">
    <div className={styles.bagSeam} />
    <div className={styles.bagLabel}>
      <span className={styles.bagLogo}>кварта<span>обжарка кофе · минск</span></span>
      <span className={styles.bagRule} />
      <span className={styles.bagOrigin}>{coffee.origin}</span>
      <span className={styles.bagName}>{coffee.name}</span>
      <span className={styles.bagNotes}>{coffee.notes}</span>
      <span className={styles.bagBottom}>{coffee.weight}</span>
    </div>
  </div>;
}

export default function Home() {
  return <OrderProvider>
    <a href="#main" className="skip-link">К содержимому</a>
    <div className={styles.shell}>
      <header className={styles.header}>
        <a href="#" className={styles.wordmark} aria-label="Кварта — в начало страницы">кварта<span>обжарка кофе</span></a>
        <p className={styles.headerNote}>Маленькая обжарка.<br />Большой четверг.</p>
        <nav aria-label="Главная навигация" className={styles.nav}>
          <a href="#coffee">Кофе</a><a href="#subscription">Подписка</a><a href="#delivery">Как получить</a>
        </nav>
        <OrderLink interest="question" className={styles.headerLink}>Написать нам <Arrow /></OrderLink>
      </header>
      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.dot} /> Минск · обжариваем с 2019</p>
            <h1 id="hero-title">В четверг<br />обжариваем.<br /><span>В пятницу —<br />у вас.</span></h1>
            <p className={styles.heroIntro}>Свежий кофе из маленькой мастерской.<br className={styles.desktopBreak} /> Для вашей кухни, рабочего стола<br className={styles.desktopBreak} /> и пяти минут для себя.</p>
            <div className={styles.heroActions}>
              <a href="#coffee" className={styles.primary}>Выбрать кофе <Arrow direction="down" /></a>
              <OrderLink interest="subscription" className={styles.textLink}>Оформить подписку <Arrow /></OrderLink>
            </div>
            <p className={styles.heroFootnote}>По 5 кг за раз. С вниманием к каждой партии.</p>
          </div>
          <figure className={styles.heroFigure}>
            <div className={styles.heroImage}>
              <Image src={heroPhoto} alt="Свежеобжаренные зёрна в охлаждающем барабане ростера"
                fill priority fetchPriority="high" decoding="sync" sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1279px) 48vw, 560px" quality={65} />
              <div className={styles.roastTag}><span>НАШ РИТМ</span><strong>ЧТ → ПТ</strong><span>обжарка → доставка</span></div>
            </div>
            <figcaption><span>От ростера до вашей чашки</span><span>1–3 дня после обжарки</span></figcaption>
          </figure>
        </section>

        <section id="coffee" className={styles.catalog} aria-labelledby="coffee-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>На этой неделе</p><h2 id="coffee-title">Какой у вас вкус?</h2></div>
            <p>Цветочный, шоколадный или с карамелью.<br />Выбирайте свой — с остальным поможем.</p>
          </div>
          <div className={styles.products}>
            {coffees.map(coffee => <article key={coffee.id} className={styles.product}>
              <div className={`${styles.productArt} ${styles[coffee.color]}`}><CoffeeBag coffee={coffee} /></div>
              <div className={styles.productMeta}><span>{coffee.weight}</span><span>{coffee.roast}</span></div>
              <h3>{coffee.origin}<br /><span>{coffee.name}</span></h3>
              <p className={styles.tasting}>{coffee.notes}</p>
              <div className={styles.productBottom}><p>{coffee.price} <span>BYN</span></p>
                <OrderLink interest="order" product={`${coffee.origin} ${coffee.name}, ${coffee.weight}`} className={styles.productLink} label={`Выбрать: ${coffee.origin} ${coffee.name}`}>Выбрать <Arrow /></OrderLink>
              </div>
            </article>)}
          </div>
          <p className={styles.catalogNote}>Не уверены в выборе? <OrderLink interest="question">Расскажите, как готовите кофе — подберём вместе <Arrow /></OrderLink></p>
        </section>

        <section id="subscription" className={styles.subscription} aria-labelledby="subscription-title">
          <div className={styles.subscriptionCopy}>
            <p className={styles.eyebrow}>Хорошая привычка</p>
            <h2 id="subscription-title">Кофе дома<br />есть. Каждый месяц.</h2>
            <p>Две пачки по 250 г — чтобы утро не начиналось<br className={styles.desktopBreak} /> с пустой банки. Доставку берём на себя.</p>
            <div className={styles.subscriptionPrice}><strong>54</strong><span>BYN / месяц<br /><span>доставка бесплатно</span></span></div>
            <OrderLink interest="subscription" className={styles.lightButton}>Хочу подписку <Arrow /></OrderLink>
          </div>
          <div className={styles.subscriptionArt} aria-hidden="true">
            <div className={styles.subscriptionCircle}>две пачки<br /><strong>одно уютное<br />утро за другим</strong></div>
            <div className={styles.pairFirst}><CoffeeBag coffee={coffees[0]} small /></div>
            <div className={styles.pairSecond}><CoffeeBag coffee={coffees[2]} small /></div>
            <span className={styles.pairCaption}>250 г + 250 г / раз в месяц</span>
          </div>
        </section>

        <section id="workshop" className={styles.story} aria-labelledby="story-title">
          <figure className={styles.storyFigure}>
            <Image src={roastingPhoto} alt="Обжаренные кофейные зёрна высыпаются из ростера в охлаждающую чашу" width={800} height={1000} sizes="(max-width: 767px) calc(100vw - 40px), 44vw" quality={65} />
            <figcaption>Небольшие партии. И много внимания к деталям.</figcaption>
          </figure>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>Люди за кофе</p>
            <h2 id="story-title">Привет.<br />Мы Аня и Дмитрий.</h2>
            <p>Раньше мы стояли за кофейной стойкой. Теперь — у ростера в нашей мастерской на Короля. С 2019 года обжариваем кофе так, как любим сами.</p>
            <p>Небольшими партиями по 5 кг. По четвергам. А в пятницу развозим по Минску — чтобы вы открывали пачку, в которой ещё чувствуется день обжарки.</p>
            <blockquote>Свежесть — это не надпись<br className={styles.desktopBreak} /> на упаковке. Это вкус в чашке.</blockquote>
            <p className={styles.signature}>Аня и Дмитрий <span>/ Кварта</span></p>
          </div>
        </section>

        <section id="delivery" className={styles.delivery} aria-labelledby="delivery-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Уже почти у вас</p><h2 id="delivery-title">Привезём. Или заходите.</h2></div></div>
          <div className={styles.deliveryGrid}>
            <div className={styles.deliveryBlock}><span className={styles.deliveryIcon} aria-hidden="true">ПТ</span><div><h3>По Минску — в пятницу</h3><p>От 50 BYN доставка бесплатная.<br />Время и детали согласуем, когда перезвоним.</p></div></div>
            <div className={styles.deliveryBlock}><span className={styles.deliveryIcon} aria-hidden="true">↗</span><div><h3>Самовывоз из мастерской</h3><a href={workshop.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>{workshop.address} <Arrow /></a><p>{workshop.weekdays}<br />{workshop.weekend}</p></div></div>
          </div>
        </section>

        <section id="lead" className={styles.lead} aria-labelledby="lead-title">
          <div className={styles.leadCopy}><p className={styles.eyebrow}>Давайте знакомиться</p><h2 id="lead-title">Хороший кофе<br />начинается<br /><span>с разговора.</span></h2><p>Оставьте номер — перезвоним, поможем выбрать кофе и оформим заказ. Оплата и все детали — после разговора.</p><span className={styles.leadMark} aria-hidden="true">к.</span><p className={styles.leadNote}>Подписка, одна пачка или просто вопрос.<br />В любом случае — рады вам.</p></div>
          <div><LeadForm /><noscript><p>Для отправки формы включите JavaScript в настройках браузера и обновите страницу.</p></noscript></div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div><a href="#" className={styles.footerLogo} aria-label="Кварта — в начало страницы">кварта</a><p>Кофе. Четверг. Минск.</p></div>
        <div><a href={workshop.mapUrl} target="_blank" rel="noopener noreferrer">{workshop.address} <Arrow /></a><p>{workshop.weekdays}<br />{workshop.weekend}</p></div>
        <div className={styles.footerLast}><p>Маленькая мастерская с 2019 года</p><a href="#main">Наверх ↑</a></div>
      </footer>
    </div>
  </OrderProvider>;
}
