(function (global) {
  "use strict";

  const VERSION = "clara-2.1";
  const SCORING_VERSION = "clara-weighted-1";
  const DIMS = ["consciencia", "lenguaje", "alineacion", "relaciones", "accion"];

  const dimensions = {
    consciencia: {
      label: "Consciencia",
      short: "Distinguir hechos, historias, emociones y necesidades antes de reaccionar.",
      color: "#BF2048",
    },
    lenguaje: {
      label: "Lenguaje",
      short: "Hablarte y expresarte con precisión, sin juicio ni minimización.",
      color: "#DD793B",
    },
    alineacion: {
      label: "Alineación",
      short: "Conectar decisiones, límites y prioridades con lo que quieres construir.",
      color: "#EDB548",
    },
    relaciones: {
      label: "Relaciones",
      short: "Escuchar, pedir apoyo y sostener conversaciones que cuidan el vínculo.",
      color: "#E68199",
    },
    accion: {
      label: "Acción",
      short: "Convertir claridad en peticiones, decisiones y pasos observables.",
      color: "#8C3D5A",
    },
  };

  const frequencyOptions = [
    { text: "Nunca", score: 0 },
    { text: "Rara vez", score: 1 },
    { text: "A veces", score: 2 },
    { text: "Casi siempre", score: 3 },
    { text: "Siempre", score: 4 },
  ];

  const interactions = [
    {
      id: "c-beh-1", dim: "consciencia", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, me dije «si no lo hago ya, pierdo la oportunidad» y respondí, publiqué o bajé un precio sin pensarlo con calma.",
      options: frequencyOptions.map((option) => ({ text: option.text, score: 4 - option.score })),
    },
    {
      id: "l-beh-1", dim: "lenguaje", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, al decir mi precio, agregué explicaciones o disculpas porque pensé «mejor lo explico, para que no piensen que es caro».",
      options: frequencyOptions.map((option) => ({ text: option.text, score: 4 - option.score })),
    },
    {
      id: "al-beh-1", dim: "alineacion", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cambié un mensaje, una publicación o un precio después de pensar «¿qué van a pensar de mí?».",
      options: frequencyOptions.map((option) => ({ text: option.text, score: 4 - option.score })),
    },
    {
      id: "r-beh-1", dim: "relaciones", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, evité pedir ayuda porque pensé «yo tengo que poder con todo».",
      options: frequencyOptions.map((option) => ({ text: option.text, score: 4 - option.score })),
    },
    {
      id: "ac-beh-1", dim: "accion", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, dejé para después mostrar, publicar o lanzar algo porque me dije «todavía no está listo».",
      options: frequencyOptions.map((option) => ({ text: option.text, score: 4 - option.score })),
    },
    {
      id: "c-beh-2", dim: "consciencia", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cuando algo no salió como esperaba, me di cuenta de la frase que me estaba diciendo (por ejemplo, «no les interesa» o «lo arruiné») antes de reaccionar.",
      options: frequencyOptions,
    },
    {
      id: "l-beh-2", dim: "lenguaje", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cuando me equivoqué, me hablé como le hablaría a alguien que quiero mucho.",
      options: frequencyOptions,
    },
    {
      id: "al-beh-2", dim: "alineacion", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cuando me pidieron algo que no me convenía (un descuento, un plazo imposible, un extra sin costo), dije que no o propuse otra opción.",
      options: frequencyOptions,
    },
    {
      id: "r-beh-2", dim: "relaciones", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cuando recibí una crítica sobre mi trabajo, pregunté qué querían decir antes de defenderme o darla por cierta.",
      options: frequencyOptions,
    },
    {
      id: "ac-beh-2", dim: "accion", kind: "behavior", type: "scale",
      stage: "Reconoce tus patrones",
      text: "En las últimas cuatro semanas, cuando me dio miedo dar un paso que ya había decidido (escribirle a una clienta, subir un precio, publicar), lo di igual, aunque fuera en pequeño.",
      options: frequencyOptions,
    },
    {
      id: "c-sit-1", dim: "consciencia", kind: "situation", type: "choice",
      stage: "Decide en contexto",
      text: "Enviaste una propuesta importante y pasan tres días sin respuesta. ¿Qué se parece más a lo que te dices y a lo que haces?",
      options: [
        { text: "Lo primero que me digo es: «Seguro no les gustó». Empiezo a pensar en bajar el precio o cambiar la propuesta antes de saber nada.", score: 0 },
        { text: "Lo primero que me digo es: «Mejor no insisto, no quiero molestar». Me ocupo en otras cosas y dejo pasar más días.", score: 1 },
        { text: "Lo primero que me digo es: «¿Habré hecho algo mal?». Le muestro el correo a alguien de confianza antes de volver a escribir.", score: 2 },
        { text: "Lo primero que me digo es: «No sé qué pasó; quizá ni lo han visto». Envío un mensaje corto para preguntar en qué van.", score: 4 },
      ],
    },
    {
      id: "l-sit-1", dim: "lenguaje", kind: "situation", type: "choice",
      stage: "Decide en contexto",
      text: "Una posible clienta te pregunta cuánto cobras. Le dices la cifra y se queda en silencio. ¿Qué se parece más a tu reacción?",
      options: [
        { text: "Lo primero que me digo es: «Se le hizo caro». Le ofrezco un descuento antes de que diga nada.", score: 0 },
        { text: "Lo primero que me digo es: «Mejor lo explico, para que no piense que es caro». Le detallo todo lo que incluye y las horas que hay detrás.", score: 2 },
        { text: "Lo primero que me digo es: «Está pensando; no tengo que llenar el silencio». Espero y le pregunto qué necesita para decidir.", score: 4 },
        { text: "Lo primero que me digo es: «Qué incómodo». Cambio de tema y espero que ella vuelva a sacarlo.", score: 1 },
      ],
    },
    {
      id: "al-sit-1", dim: "alineacion", kind: "situation", type: "choice",
      stage: "Decide en contexto",
      text: "Una clienta conocida te pide un trabajo para el viernes, con descuento «porque ya nos conocemos». Para cumplir tendrías que mover otros compromisos. ¿Qué se parece más a lo que harías?",
      options: [
        { text: "Lo primero que me digo es: «Si le digo que no, va a pensar que me creí mucho». Acepto el plazo y el descuento, aunque me toque trasnochar.", score: 0 },
        { text: "Lo primero que me digo es: «No puedo con esto». Le digo que no de una vez, sin ofrecerle otra opción.", score: 2 },
        { text: "Lo primero que me digo es: «Quiero ayudarla, pero no a cualquier costo». Le digo lo que sí puedo: otra fecha, o el viernes con mi tarifa normal.", score: 4 },
        { text: "Lo primero que me digo es: «No sé qué es lo correcto». Pregunto a otras emprendedoras qué harían y sigo lo que diga la mayoría.", score: 1 },
      ],
    },
    {
      id: "r-sit-1", dim: "relaciones", kind: "situation", type: "choice",
      stage: "Decide en contexto",
      text: "Una colaboradora te entrega algo distinto a lo que acordaron y la entrega a tu clienta es mañana. ¿Qué se parece más a lo que harías?",
      options: [
        { text: "Lo primero que me digo es: «Si no lo hago yo, nadie lo hará bien». Lo rehago yo esa noche y la próxima vez delego menos.", score: 1 },
        { text: "Lo primero que me digo es: «Esto es inaceptable». Le escribo enumerando todo lo que está mal.", score: 0 },
        { text: "Lo primero que me digo es: «Algo se entendió distinto». La llamo, le muestro la diferencia y acordamos quién ajusta qué antes de mañana.", score: 4 },
        { text: "Lo primero que me digo es: «Si le hablo ahora, voy a sonar molesta». Espero a calmarme, aunque se nos vaya el tiempo.", score: 2 },
      ],
    },
    {
      id: "ac-sit-1", dim: "accion", kind: "situation", type: "choice",
      stage: "Decide en contexto",
      text: "Tu nueva oferta está casi lista para publicarse, pero todavía ves detalles que podrías mejorar. ¿Qué se parece más a lo que harías?",
      options: [
        { text: "Lo primero que me digo es: «Todavía no está lista». Sigo ajustando y vuelvo a mover la fecha.", score: 0 },
        { text: "Lo primero que me digo es: «Si no la saco hoy, ya no la saco». La publico esa misma noche, sin revisar lo básico.", score: 1 },
        { text: "Lo primero que me digo es: «Lo importante ya está». Reviso lo esencial, pongo fecha y anoto las mejoras para después de escuchar a las primeras clientas.", score: 4 },
        { text: "Lo primero que me digo es: «Primero veo cómo lo hacen otras». Reviso más ejemplos antes de decidir si la mía está bien.", score: 2 },
      ],
    },
    {
      id: "c-app-1", dim: "consciencia", kind: "applied", type: "choice",
      stage: "Reconoce tu tendencia",
      text: "Hay algo que ya sabes que te conviene hacer en tu negocio (subir precios, publicar seguido, decir que no) y aun así vuelves a lo de antes. Cuando te descubres pensando «¿por qué volví a lo mismo?», ¿qué suele pasar después?",
      prompt: "Elige lo que más se parece a ti, no lo que consideras ideal.",
      options: [
        { text: "Me digo que no tengo disciplina y me molesto conmigo.", score: 0 },
        { text: "Lo dejo pasar y me digo que lo retomaré cuando tenga más tiempo.", score: 1 },
        { text: "Me prometo empezar de cero el lunes, con un plan nuevo y más estricto.", score: 2 },
        { text: "Intento recordar qué me dije justo antes de soltarlo; casi siempre encuentro un miedo concreto.", score: 4 },
      ],
    },
    {
      id: "l-app-1", dim: "lenguaje", kind: "applied", type: "choice",
      stage: "Reconoce tu tendencia",
      text: "Te equivocas en una entrega y tu clienta lo nota. ¿Qué frase se parece más a la que aparece primero en tu cabeza?",
      prompt: "No elijas la más útil: elige la más parecida a lo que de verdad te dices.",
      options: [
        { text: "«Siempre lo arruino. No sirvo para esto.»", score: 0 },
        { text: "«A estas alturas ya debería poder manejar esto sin equivocarme.»", score: 1 },
        { text: "«Me faltó confirmar la fecha. Lo corrijo y la próxima vez lo anoto.»", score: 4 },
        { text: "«No fue para tanto; mejor no le doy más vueltas.»", score: 2 },
      ],
    },
    {
      id: "al-app-1", dim: "alineacion", kind: "applied", type: "selectTwo",
      stage: "Reconoce tu tendencia",
      text: "Te ofrecen un proyecto urgente. ¿Cuáles dos frases pesan más en tu cabeza al tomar la decisión de aceptar o no?",
      prompt: "Selecciona las dos que de verdad aparecen en ti, no las que crees que deberían aparecer.",
      options: [
        { id: "values", text: "«¿Esto me acerca al negocio que quiero tener, o solo me llena la semana?»", score: 2 },
        { id: "capacity", text: "«¿Puedo hacerlo bien sin incumplir lo que ya prometí?»", score: 2 },
        { id: "approval", text: "«¿Qué van a pensar de mí si digo que no?»", score: 0 },
        { id: "visibility", text: "«Otras ya estarían aceptando proyectos así; no me puedo quedar atrás.»", score: 0 },
        { id: "fear", text: "«Si no lo acepto ya, no me vuelven a buscar.»", score: 0 },
      ],
    },
    {
      id: "r-app-1", dim: "relaciones", kind: "applied", type: "selectTwo",
      stage: "Reconoce tu tendencia",
      text: "Estás atascada con algo de tu negocio: una tarea, una decisión o un cliente difícil. Elige dos opciones que se parezcan más a lo que normalmente te dices y haces.",
      prompt: "No hay respuestas correctas: piensa en lo que de verdad sueles hacer, no en lo que te gustaría hacer.",
      options: [
        { id: "solo", text: "Me digo «si no lo hago yo, nadie lo hará bien» y lo resuelvo sola, aunque me quite horas de descanso.", score: 0 },
        { id: "should-alone", text: "Me digo «ya debería poder manejar esto sola» y lo intento un tiempo más antes de pedir.", score: 1 },
        { id: "ask", text: "Le pido a una persona concreta lo que necesito, con detalle y fecha.", score: 2 },
        { id: "share", text: "Le cuento a alguien de confianza dónde estoy atascada, aunque todavía no tenga nada resuelto.", score: 2 },
        { id: "apologize", text: "Me digo: «no quiero molestar» y pido ayuda. Al final acepto el resultado así no sea lo que esperaba.", score: 1 },
      ],
    },
    {
      id: "ac-app-1", dim: "accion", kind: "applied", type: "selectTwo",
      stage: "Reconoce tu tendencia",
      text: "Piensa en algo que quieres hacer (diseñar un nuevo servicio, subir precios, empezar a publicar). Elige dos opciones que se parezcan mucho a cómo sueles empezar.",
      prompt: "No hay respuestas correctas: piensa en lo que de verdad te pasa, no en lo que crees que debería pasar.",
      options: [
        { id: "vague-cue", text: "Espero a sentirme completamente lista para empezar.", score: 0 },
        { id: "clear-cue", text: "Separo un día y una hora en mi agenda, y empiezo ese día.", score: 2 },
        { id: "pressure-cue", text: "Arranco cuando la urgencia ya no me deja aplazarlo más.", score: 1 },
        { id: "vague-action", text: "Sigo investigando o puliendo antes de mostrar algo.", score: 0 },
        { id: "clear-action", text: "Doy un paso pequeño que alguien pueda ver: un mensaje, un borrador, una publicación.", score: 2 },
        { id: "large-action", text: "Intento terminarlo todo de una vez para quitármelo de encima.", score: 1 },
      ],
    },
  ];

  const archetypes = {
    chispa: {
      name: "La Chispa",
      subtitle: "Actúas rápido; tu reto es no decidir desde la urgencia.",
      color: "#BF2048",
      resource: "Lanzas, respondes y mueves tus ideas sin esperar a tenerlo todo resuelto.",
      autopilot: "Cuando aparece la voz de «si no lo hago ya, pierdo la oportunidad», publicas, respondes o bajas precios antes de revisar si es lo que quieres.",
      decision: "Las ofertas con plazo, los descuentos, las respuestas a una crítica y los «sí» rápidos son las decisiones donde más te conviene pausar.",
      innerVoice: "Si no lo hago ya, pierdo la oportunidad.",
      innerVoiceMore: [
        "Lo publico ya y después lo arreglo.",
        "Mejor digo que sí y luego veo cómo lo saco.",
      ],
      desc: "Actúas rápido y tu negocio avanza porque tú lo mueves. Detrás de esa rapidez suele haber una voz interna que dice «si no lo hago ya, pierdo la oportunidad», y bajo presión esa voz decide antes de que alcances a revisar qué sientes o qué necesitas. Se nota cuando publicas, respondes o bajas precios en caliente, cuando aceptas todo lo que llega o cuando desapareces una temporada después de un tropiezo. Tu evolución no es frenar: es tomar una pausa corta para elegir qué movimiento sí te conviene.",
      showsUp: [
        "Publicas, respondes o bajas precios en caliente, antes de revisar si es lo que quieres.",
        "Aceptas proyectos o pedidos que no te convienen por miedo a perder la oportunidad.",
        "Alternas temporadas de mucha presencia con temporadas en que desapareces.",
      ],
      strengths: [
        "Lanzas sin esperar a que todo esté perfecto.",
        "Respondes rápido y mantienes tu negocio en movimiento.",
        "Tu entusiasmo contagia a clientas y aliadas.",
      ],
      growth: [
        "Antes de publicar, responder o decidir, haz una pausa de un minuto y pregúntate: ¿es urgente o es ansiedad?",
        "Define de antemano tu precio y tus condiciones para no negociarlos en caliente.",
        "Cuando algo no salga bien, háblate como le hablarías a una clienta antes de decidir el siguiente paso.",
      ],
      newPhrase: "La urgencia es información, no una orden.",
      ally: "artesana",
      allyWhy: "Su cuidado te recuerda revisar antes de soltar, sin perder tu rapidez.",
      shape: "spark",
    },
    artesana: {
      name: "La Artesana",
      subtitle: "Cuidas la calidad; tu reto es mostrarte antes de sentirte lista.",
      color: "#DD793B",
      resource: "Cuidas los detalles y entregas un trabajo de calidad que habla bien de ti.",
      autopilot: "La voz de «todavía no está listo» te hace seguir afinando y postergar lo que ya podrías mostrar.",
      decision: "Lanzar, publicar, salir en cámara o pedir feedback antes de sentirte segura son las decisiones que más la activan.",
      innerVoice: "Todavía no está listo.",
      innerVoiceMore: [
        "Cuando tenga más tiempo, lo lanzo bien.",
        "Si lo muestro así, van a notar todo lo que le falta.",
      ],
      desc: "Cuidas la calidad de todo lo que haces y eso se nota en tu trabajo. Pero tu voz interna suele repetir «todavía no está listo», y esa exigencia te protege del juicio a costa de frenar tu crecimiento. Se nota cuando postergas un lanzamiento o una publicación, cuando solo muestras lo terminado o cuando prefieres que hable la marca antes que tú. Así, las personas que necesitan lo que ofreces no siempre te encuentran. Tu evolución no es tener más certeza: es mostrarte con la incertidumbre incluida.",
      showsUp: [
        "Postergas lanzamientos y publicaciones porque siempre falta un ajuste más.",
        "Solo compartes lo terminado y dejas el proceso fuera de la vista.",
        "Te quedas detrás de la marca: hablas del producto, pero casi nunca de ti.",
      ],
      strengths: [
        "Cuidas cada detalle de lo que entregas.",
        "Piensas antes de decidir y rara vez improvisas lo importante.",
        "Tu exigencia garantiza un producto o servicio de calidad.",
      ],
      growth: [
        "Define qué es «suficientemente bueno» para lanzar y ponle fecha.",
        "Comparte una vez por semana algo de tu proceso, aunque no esté terminado.",
        "Anota qué te está costando no mostrarte: ventas, contactos, conversaciones.",
      ],
      newPhrase: "Suficientemente bueno también es mostrarse.",
      ally: "chispa",
      allyWhy: "Su impulso te recuerda que publicar a tiempo también es cuidar a quien te espera.",
      shape: "arch",
    },
    conectora: {
      name: "La Conectora",
      subtitle: "Lees bien a los demás; tu reto es sostener tu criterio.",
      color: "#EDB548",
      resource: "Lees con precisión lo que necesitan tus clientas y adaptas tu comunicación para conectar.",
      autopilot: "Cuando aparece «¿qué van a pensar de mí?», ajustas tu mensaje, tu precio o tu estilo para encajar.",
      decision: "Fijar precios, decir que no, publicar una opinión propia o sostener una decisión frente a críticas son los momentos que más la activan.",
      innerVoice: "¿Qué van a pensar de mí?",
      innerVoiceMore: [
        "A ella le funciona; quizá yo debería hacerlo igual.",
        "Si cobro eso, van a pensar que me creo mucho.",
      ],
      desc: "Eres sensible a lo que sienten y piensan las demás personas, y eso te hace muy cercana con tus clientas. En tu propio negocio, esa misma sensibilidad puede convertirse en la pregunta «¿qué van a pensar de mí?». Entonces ajustas tu mensaje, tu precio o tu estilo según quién esté mirando, y la comparación con otras emprendedoras te deja la sensación de que nunca es suficiente. Tu evolución es escuchar a los demás sin soltar tu criterio, para que tu voz no dependa de la aprobación externa.",
      showsUp: [
        "Cambias tu mensaje, tu precio o tu estilo según quién te esté mirando.",
        "Te comparas con otras emprendedoras y dudas de lo que ya habías decidido.",
        "Te cuesta sostener una decisión cuando alguien opina distinto.",
      ],
      strengths: [
        "Lees muy bien lo que tu clienta necesita.",
        "Aprendes de otras personas con apertura.",
        "Tu sensibilidad crea vínculos genuinos.",
      ],
      growth: [
        "Define tres valores no negociables de tu marca y vuelve a ellos antes de decidir.",
        "Sostén una decisión durante una semana sin pedir la opinión de nadie.",
        "Silencia por unos días las cuentas que te dejan comparándote.",
      ],
      newPhrase: "Puedo escuchar sin soltar mi criterio.",
      ally: "capitana",
      allyWhy: "Su criterio propio te ayuda a sostener una decisión aunque no todos la aplaudan.",
      shape: "orbit",
    },
    voz: {
      name: "La Voz Valiosa",
      subtitle: "Tu trabajo vale mucho; tu reto es nombrarlo sin justificarte.",
      color: "#B7791F",
      resource: "Ofreces un trabajo con calidad real y lo explicas con cercanía y honestidad.",
      autopilot: "La voz de «mejor lo explico, para que no piensen que es caro» te lleva a justificar el precio, achicar tu negocio y suavizar la oferta.",
      decision: "Decir tu precio, presentar tu propuesta, hablar de tu experiencia o cobrar lo que corresponde son las decisiones que más la activan.",
      innerVoice: "Mejor lo explico, para que no piensen que es caro.",
      innerVoiceMore: [
        "Es algo sencillo, nada del otro mundo.",
        "Si me preguntan el precio, mejor ofrezco un descuento de una vez.",
      ],
      desc: "Tu trabajo tiene calidad real, pero tus palabras no siempre lo acompañan. Tu voz interna suele adelantarse: «mejor lo explico, para que no piensen que es caro». Entonces justificas el precio antes de que alguien lo cuestione, describes tu negocio en pequeño y suavizas tu oferta hasta que deja de entenderse. En un negocio, ese lenguaje se traduce en precios bajos y en clientas que no saben por qué elegirte. Tu evolución no es sonar más grande de lo que eres: es nombrar con precisión el valor que ya ofreces.",
      showsUp: [
        "Justificas tu precio antes de que alguien lo cuestione.",
        "Describes tu negocio en pequeño: «es algo sencillo», «solo hago…».",
        "Suavizas tu oferta con tantas explicaciones que deja de entenderse.",
      ],
      strengths: [
        "Ofreces un producto o servicio de calidad real.",
        "Hablas de lo que haces con cercanía y honestidad.",
        "Escuchas con atención lo que tu clienta necesita.",
      ],
      growth: [
        "Di tu precio en una frase, sin explicación extra, y haz silencio después.",
        "Escribe una frase clara sobre qué ofreces y por qué importa, y úsala esta semana.",
        "Cada vez que te achiques al hablar, anota qué te estabas diciendo por dentro.",
      ],
      newPhrase: "Mi precio es información, no una disculpa.",
      ally: "brujula",
      allyWhy: "Su coherencia entre lo que piensa y lo que dice te ayuda a nombrar tu valor sin rodeos.",
      shape: "voice",
    },
    capitana: {
      name: "La Capitana",
      subtitle: "Resuelves con criterio propio; tu reto es pedir apoyo a tiempo.",
      color: "#E68199",
      resource: "Resuelves con autonomía, asumes responsabilidad y mantienes tu negocio en marcha.",
      autopilot: "La voz de «si no lo hago yo, nadie lo hará bien» te lleva a cargar sola, corregir en silencio y tomar la crítica como un veredicto.",
      decision: "Delegar, pedir ayuda, recibir feedback o abrir una conversación difícil son las decisiones que más la activan.",
      innerVoice: "Si no lo hago yo, nadie lo hará bien.",
      innerVoiceMore: [
        "Explicarlo me toma más tiempo que hacerlo yo.",
        "Nadie tiene que saber que esto me está costando.",
      ],
      desc: "Resuelves, decides y avanzas sin esperar a nadie, y esa autonomía te ha hecho fuerte. Tu voz interna suele decir «si no lo hago yo, nadie lo hará bien», así que cargas con casi todo el negocio. Se nota cuando corriges en silencio el trabajo de otras personas, cuando no pides ayuda aunque la necesites o cuando una crítica te llega como un veredicto y no como información útil. Decidir sola y agotarte sola tiene un costo. Tu evolución no es depender de otros: es elegir en quién apoyarte.",
      showsUp: [
        "Corriges en silencio lo que otras personas hacen, en vez de decirlo.",
        "No pides ayuda, aunque estés al límite.",
        "Recibes una crítica como un veredicto sobre ti, no como un dato sobre tu trabajo.",
      ],
      strengths: [
        "Resuelves con autonomía y asumes responsabilidad.",
        "Tienes criterio propio para decidir rápido.",
        "Te sostienes en los momentos difíciles.",
      ],
      growth: [
        "Pide ayuda en algo pequeño esta semana y observa qué pasa.",
        "Define quiénes forman tu red de apoyo: alguien técnico, alguien estratégico y alguien que te escuche.",
        "Ante una crítica, separa el dato útil del juicio sobre ti antes de responder.",
      ],
      newPhrase: "Apoyarme también es liderar.",
      ally: "conectora",
      allyWhy: "Su facilidad para crear vínculos te recuerda que pedir apoyo también fortalece tu negocio.",
      shape: "helm",
    },
    exploradora: {
      name: "La Exploradora",
      subtitle: "Ya reconoces tu patrón; tu reto es sostenerlo bajo presión.",
      color: "#4A8A6A",
      resource: "Reconoces tus patrones y ya tienes momentos reales de coherencia al comunicar y decidir.",
      autopilot: "En semanas difíciles, el miedo vuelve a decidir y aparece la voz de «ya sé qué debería hacer… ¿por qué volví a lo mismo?».",
      decision: "Las decisiones bajo presión, cansancio o mucha visibilidad son las que más ponen a prueba tu constancia.",
      innerVoice: "Ya sé qué debería hacer… ¿por qué volví a lo mismo?",
      innerVoiceMore: [
        "El lunes lo tenía clarísimo; el jueves ya dudé de todo.",
        "Si ya sé esto, no debería costarme tanto.",
      ],
      desc: "Ya identificas tus creencias, cuestionas tu diálogo interno y decides con más criterio que antes, aunque no todos los días. Hay semanas de claridad y semanas en que el miedo vuelve a decidir, y aparece la voz de «ya sé qué debería hacer… ¿por qué volví a lo mismo?». Eso no es un retroceso: es el proceso normal de quien está construyendo una nueva forma de comunicar. Tu evolución ahora es la constancia: convertir esos momentos de claridad en hábitos que te sostengan en las semanas difíciles.",
      showsUp: [
        "Hay semanas en que comunicas con claridad y semanas en que el miedo decide por ti.",
        "Bajo presión, vuelves a postergar, a justificarte o a decir que sí sin pensarlo.",
        "Te frustras contigo cuando no sostienes lo que ya sabes.",
      ],
      strengths: [
        "Reconoces tus patrones cuando aparecen.",
        "Ya tienes momentos reales de coherencia entre lo que piensas y lo que comunicas.",
        "Sigues aprendiendo y ajustando sin rendirte.",
      ],
      growth: [
        "Haz una revisión semanal de diez minutos: ¿qué decidí desde la claridad y qué desde el miedo?",
        "Anota tus avances para no medirte solo por lo que falta.",
        "Elige una dimensión de tu mapa y practícala durante 30 días.",
      ],
      newPhrase: "Volver al camino también es avanzar.",
      ally: "artesana",
      allyWhy: "Su método paciente te ayuda a convertir tus momentos de claridad en rutina.",
      shape: "path",
    },
    brujula: {
      name: "La Brújula",
      subtitle: "Comunicas con coherencia; tu reto es no exigirte claridad perfecta.",
      color: "#8C3D5A",
      resource: "Conectas lo que piensas, sientes, comunicas y haces con buena coherencia.",
      autopilot: "La voz de «ya debería poder manejar esto sola» te exige claridad constante y te dificulta pedir ayuda o celebrar.",
      decision: "En momentos de presión, crecimiento o cambio, el reto es sostener tu proceso sin convertirlo en perfección.",
      innerVoice: "Ya debería poder manejar esto sola.",
      innerVoiceMore: [
        "Si ya sé cómo funciona, pedir ayuda sería retroceder.",
        "Antes de celebrar, mejor reviso qué falta.",
      ],
      desc: "Tienes una relación consciente con tu diálogo interno: reconoces tus creencias, las cuestionas cuando hace falta y comunicas con coherencia. No es que no sientas miedo; es que no dejas que decida por ti. Tu reto está en otro lugar: la voz de «ya debería poder manejar esto sola». Esa voz te exige claridad todo el tiempo, te hace difícil pedir ayuda y te lleva a mirar lo que falta antes que lo logrado. Tu evolución es sostener esa consciencia en la presión sin convertirla en perfección.",
      showsUp: [
        "Comunicas con coherencia, pero te exiges tener claridad todo el tiempo.",
        "Te cuesta pedir ayuda porque sientes que ya deberías saber resolverlo.",
        "Pasas rápido al siguiente reto sin celebrar lo que lograste.",
      ],
      strengths: [
        "Reconoces tus creencias y patrones con claridad.",
        "Lo que sientes, piensas y comunicas va en la misma dirección.",
        "Actúas con miedo sin dejar que el miedo decida.",
      ],
      growth: [
        "Cierra cada semana anotando tres avances antes de revisar lo pendiente.",
        "Pide una opinión o una ayuda concreta, aunque sientas que podrías sola.",
        "Comparte tu proceso con otras emprendedoras: acompañar también te sostiene.",
      ],
      newPhrase: "No necesito claridad perfecta para confiar en mi proceso.",
      ally: "exploradora",
      allyWhy: "Su comodidad con el proceso te recuerda que avanzar no exige tenerlo todo resuelto.",
      shape: "compass",
    },
  };

  const toolsByDimension = {
    consciencia: {
      now: {
        name: "Hecho, historia y necesidad",
        duration: "4 minutos",
        intro: "Separa la información disponible de la interpretación que está guiando tu reacción.",
        steps: ["Escribe el hecho observable en una frase.", "Completa: “La historia que me estoy contando es…”", "Nombra la emoción y la necesidad presentes.", "Decide qué información necesitas antes de actuar."],
      },
      challenge: {
        name: "Siete pausas conscientes",
        intro: "Durante siete días, registra una decisión que active urgencia, miedo o comparación.",
        steps: ["Haz una pausa de 60 segundos.", "Distingue hecho e interpretación.", "Anota qué cambió en tu decisión después de la pausa."],
      },
      script: "Antes de responder, quiero comprobar lo que sé. Lo que observo es ____. Lo que todavía necesito aclarar es ____.",
    },
    lenguaje: {
      now: {
        name: "Nombrar sin minimizar",
        duration: "5 minutos",
        intro: "Convierte una frase que te reduce en una descripción precisa de tu trabajo.",
        steps: ["Escribe cómo sueles presentar tu oferta.", "Tacha disculpas, diminutivos y justificaciones.", "Añade el problema que resuelves y el cambio que facilitas.", "Léela en voz alta una vez."],
      },
      challenge: {
        name: "Valor en una frase",
        intro: "Durante siete días, practica una frase clara sobre lo que haces, para quién y por qué importa.",
        steps: ["Usa la misma estructura cada día.", "No añadas una disculpa al final.", "Registra qué palabra todavía te cuesta sostener."],
      },
      script: "El valor de este trabajo está en ____. La inversión es ____. ¿Qué necesitas saber para decidir?",
    },
    alineacion: {
      now: {
        name: "Filtro de decisión Moraleja",
        duration: "5 minutos",
        intro: "Revisa una oportunidad pendiente antes de responder desde la urgencia.",
        steps: ["Nombra el objetivo que esta oportunidad apoyaría.", "Revisa un valor y un límite no negociable.", "Confirma capacidad real de tiempo y energía.", "Formula las condiciones necesarias para decir que sí."],
      },
      challenge: {
        name: "Un límite visible",
        intro: "Elige un límite que tu negocio necesita y practícalo durante siete días.",
        steps: ["Escríbelo de forma concreta.", "Comunícalo antes de que aparezca el conflicto.", "Registra qué decisión hizo más sencilla."],
      },
      script: "Esto es importante para mí y puedo ofrecer ____. Para cuidar el alcance y cumplir bien, necesito que ____.",
    },
    relaciones: {
      now: {
        name: "Escuchar antes de resolver",
        duration: "4 minutos",
        intro: "Prepara una pregunta que te permita comprender antes de defender o corregir.",
        steps: ["Describe el desacuerdo sin juicio.", "Escribe una pregunta genuina.", "Define qué necesitas escuchar antes de responder.", "Cierra con una petición verificable."],
      },
      challenge: {
        name: "Una petición de apoyo",
        intro: "Durante siete días, pide una ayuda concreta que normalmente intentarías resolver sola.",
        steps: ["Elige a la persona adecuada.", "Pide una acción específica.", "Aclara fecha o contexto.", "Agradece sin minimizar la necesidad."],
      },
      script: "Cuando ocurrió ____, el impacto fue ____. Quiero entender tu perspectiva. ¿Qué pasó y qué necesitamos acordar ahora?",
    },
    accion: {
      now: {
        name: "Siguiente paso observable",
        duration: "3 minutos",
        intro: "Reduce una intención amplia a una acción que puedas completar y comprobar.",
        steps: ["Elige una decisión que estás aplazando.", "Define una acción de menos de 30 minutos.", "Asigna día, hora y señal de inicio.", "Decide a quién informarás cuando esté hecha."],
      },
      challenge: {
        name: "Versión suficientemente buena",
        intro: "Durante siete días, mueve una idea usando una definición explícita de “lista para probar”.",
        steps: ["Define tres requisitos indispensables.", "Separa mejoras para una segunda versión.", "Obtén feedback real antes de volver a perfeccionar."],
      },
      script: "Si ocurre ____, entonces haré ____ antes de ____. Sabré que está hecho cuando ____.",
    },
  };

  function bandFor(score) {
    if (score >= 70) return { key: "available", label: "Recurso disponible" };
    if (score >= 40) return { key: "practice", label: "En práctica" };
    return { key: "exploration", label: "En exploración" };
  }

  function scoreInteraction(interaction, answer) {
    if (answer == null) return null;
    if (interaction.type === "scale" || interaction.type === "choice") {
      const option = interaction.options[Number(answer)];
      return option ? option.score : null;
    }
    if (interaction.type === "classify") {
      const correct = interaction.items.reduce((total, item) => total + (answer[item.id] === item.answer ? 1 : 0), 0);
      return (correct / interaction.items.length) * 4;
    }
    if (interaction.type === "selectTwo") {
      return Math.min(4, (answer || []).reduce((total, id) => {
        const option = interaction.options.find((item) => item.id === id);
        return total + (option ? option.score : 0);
      }, 0));
    }
    if (interaction.type === "sequence") {
      if (!Array.isArray(answer) || answer.length !== interaction.correctOrder.length) return null;
      let correctPairs = 0;
      let totalPairs = 0;
      for (let i = 0; i < interaction.correctOrder.length; i += 1) {
        for (let j = i + 1; j < interaction.correctOrder.length; j += 1) {
          totalPairs += 1;
          if (answer.indexOf(interaction.correctOrder[i]) < answer.indexOf(interaction.correctOrder[j])) correctPairs += 1;
        }
      }
      return (correctPairs / totalPairs) * 4;
    }
    if (interaction.type === "builder") {
      return Math.min(4, interaction.groups.reduce((total, group) => {
        const option = group.options.find((item) => item.id === answer[group.id]);
        return total + (option ? option.score : 0);
      }, 0));
    }
    return null;
  }

  function determineArchetypes(scores) {
    const ordered = DIMS.slice().sort((a, b) => scores[a] - scores[b]);
    const values = DIMS.map((dim) => scores[dim]);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const spread = Math.max.apply(null, values) - Math.min.apply(null, values);
    const tensionMap = {
      consciencia: "chispa",
      lenguaje: "voz",
      alineacion: "conectora",
      relaciones: "capitana",
      accion: "artesana",
    };

    let primary;
    let secondary = null;
    if (Math.min.apply(null, values) >= 70 && average >= 78) {
      primary = "brujula";
      if (Math.min.apply(null, values) < 76) secondary = "exploradora";
    } else if (Math.min.apply(null, values) >= 48 && spread <= 22) {
      primary = "exploradora";
      if (scores[ordered[0]] < 58) secondary = tensionMap[ordered[0]];
    } else {
      primary = tensionMap[ordered[0]];
      if (scores[ordered[1]] - scores[ordered[0]] <= 8) secondary = tensionMap[ordered[1]];
      else if (average >= 64) secondary = "exploradora";
    }
    if (secondary === primary) secondary = null;
    return { primary, secondary, average: Math.round(average), orderedDimensions: ordered };
  }

  function calculateResult(answers) {
    const buckets = {};
    DIMS.forEach((dim) => { buckets[dim] = { behavior: [], situation: [], applied: [] }; });

    interactions.forEach((interaction) => {
      const score = scoreInteraction(interaction, answers[interaction.id]);
      if (score != null) buckets[interaction.dim][interaction.kind].push(score);
    });

    const scores = {};
    const bands = {};
    DIMS.forEach((dim) => {
      const behavior = buckets[dim].behavior;
      const behaviorAverage = behavior.length ? behavior.reduce((a, b) => a + b, 0) / behavior.length : 0;
      const situation = buckets[dim].situation.length ? buckets[dim].situation[0] : 0;
      const applied = buckets[dim].applied.length ? buckets[dim].applied[0] : 0;
      const weighted = behaviorAverage * 0.4 + situation * 0.3 + applied * 0.3;
      scores[dim] = Math.max(0, Math.min(100, Math.round((weighted / 4) * 100)));
      bands[dim] = bandFor(scores[dim]);
    });

    const match = determineArchetypes(scores);
    const practiceDimension = match.orderedDimensions[0];
    return {
      instrumentVersion: VERSION,
      scoringVersion: SCORING_VERSION,
      scores,
      bands,
      primary: match.primary,
      secondary: match.secondary,
      average: match.average,
      practiceDimension,
      resourceDimension: match.orderedDimensions[match.orderedDimensions.length - 1],
      tools: toolsByDimension[practiceDimension],
    };
  }

  function buildResultPayload(result, completedAt) {
    return {
      instrumentVersion: result.instrumentVersion,
      scoringVersion: result.scoringVersion,
      completedAt: completedAt || new Date().toISOString(),
      scores: result.scores,
      bands: result.bands,
      dimensionMeta: Object.fromEntries(DIMS.map((dim) => [dim, { ...dimensions[dim] }])),
      primary: result.primary,
      secondary: result.secondary,
      average: result.average,
      practiceDimension: result.practiceDimension,
      resourceDimension: result.resourceDimension,
      archetype: archetypes[result.primary],
      secondaryArchetype: result.secondary ? archetypes[result.secondary] : null,
      tools: result.tools,
    };
  }

  global.CLARA = {
    VERSION,
    SCORING_VERSION,
    DIMS,
    dimensions,
    interactions,
    archetypes,
    toolsByDimension,
    bandFor,
    scoreInteraction,
    determineArchetypes,
    calculateResult,
    buildResultPayload,
  };
})(window);
